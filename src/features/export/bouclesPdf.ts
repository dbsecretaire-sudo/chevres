import type { Chevre } from '@/features/cheptel/types';
import { avecIndicatif } from '@/features/export/services/lignesExport';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { getSettings, identificationCheptel, indicatifMarquagePar } from '@/features/settings/settings';
import {
  estBoucleDeRemplacement,
  libelleDeLaSorte,
  nePasPoser,
  texteDeLaRemarque,
  texteDeLaSortie,
  trierParLotAchat,
} from '@/features/stock/services/boucles';
import type { ListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import type { BoucleStock } from '@/features/stock/types';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_BOUCLES } from '@/shared/constants/export';
import { ETAT_BOUCLE } from '@/shared/constants/stock';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';
import { formatDateShortFR, todayISO } from '@/shared/utils/dates';

const T = TEXTES.stock.boucles;
const P = TEXTES.export.pdf.boucles;

/** Ce que l'en-tête de la liste dit de l'exploitation : le nom, l'adresse et le n° de cheptel (comme sur le formulaire officiel). */
export interface IdentiteListe {
  nom: string;
  adresse: string[];
  cheptel: string;
}

/** Une ligne de la liste imprimée : le n° d'identification, l'année de naissance, les dates de pose et les commentaires. */
export interface LigneListe {
  identification: string;
  naissance: string;
  pose: string;
  secondRepere: string;
  commentaires: string;
}

/** Une liste imprimée : une sorte de boucles dans l'état choisi, sur le modèle de la « liste des repères » officielle. */
export interface ListeImprimee {
  /** Le titre : « LISTE DES REPERES EN STOCK » pour les boucles à poser, « … POSES » pour les posées. */
  titre: { debut: string; fin: string };
  sorte: string;
  filtre: string;
  lignes: LigneListe[];
}

/** « FR 21228200888 » : l'indicatif et le numéro se lisent d'un trait ; les deux premières lettres (le pays) sont en gras à part. */
const identificationHtml = (identification: string): string => {
  const m = /^([A-Za-z]{2})\s*(.*)$/.exec(identification.trim());
  return m ? `<b class="pays">${echapper(m[1].toUpperCase())}</b>&nbsp;&nbsp;${echapper(m[2])}` : echapper(identification);
};

/** La ligne imprimée d'une boucle : l'animal qui la porte donne l'année de naissance, sa sortie et la remarque vont en commentaires. */
export function ligneDeLaListe(
  b: BoucleStock,
  animal: Pick<Chevre, 'dateNaissance'> | undefined,
  sortie: { statut: string; date?: string } | undefined,
  indicatif: string | undefined,
): LigneListe {
  const commentaires = [
    b.remarque ? texteDeLaRemarque(b.remarque) : undefined,
    !b.remarque && nePasPoser(b) ? T.nePasPoser : undefined,
    // Une boucle rouge ou de rebouclage s'achète en quantité, sans numéro : la date d'achat est ce qui la distingue.
    estBoucleDeRemplacement(b.article) && b.dateAchat ? P.achatLe(formatDateShortFR(b.dateAchat)) : undefined,
    sortie ? texteDeLaSortie(sortie.statut, sortie.date) || P.oui : undefined,
  ].filter(Boolean);
  return {
    identification: avecIndicatif(b.numero, indicatif),
    naissance: animal?.dateNaissance?.slice(0, 4) ?? '',
    pose: b.datePose ? formatDateShortFR(b.datePose) : '',
    // Le second repère se pose le même jour que le premier.
    secondRepere: b.datePose ? formatDateShortFR(b.datePose) : '',
    commentaires: commentaires.join(' — '),
  };
}

/**
 * Sépare les boucles d'avant et d'après la date d'installation de l'exploitant actuel : une boucle posée est d'avant quand sa date de
 * pose précède cette date, sinon (non posée) sa date d'achat ; sans date, elle est d'après (une boucle en stock est à l'exploitant
 * actuel). Une boucle non posée suit sa commande : quand une autre boucle de la même facture est posée depuis l'installation, elle est
 * d'après, même si la commande est plus ancienne. `toutes` : toutes les boucles de la sorte (pas seulement celles imprimées), où se
 * retrouvent les autres boucles de la commande.
 */
export function separerSelonInstallation(
  boucles: BoucleStock[],
  installation: string,
  toutes: BoucleStock[] = boucles,
): { avant: BoucleStock[]; apres: BoucleStock[] } {
  const commandesEnCours = new Set(
    toutes.filter((b) => b.factureId && b.datePose && b.datePose >= installation).map((b) => b.factureId),
  );
  const avant: BoucleStock[] = [];
  const apres: BoucleStock[] = [];
  for (const b of boucles) {
    const date = b.datePose ?? b.dateAchat;
    const suitSaCommande = !b.datePose && !!b.factureId && commandesEnCours.has(b.factureId);
    (!suitSaCommande && date && date < installation ? avant : apres).push(b);
  }
  return { avant, apres };
}

const titreDeLEtat = (etat: string): { debut: string; fin: string } => ({
  debut: P.titreListe,
  fin: etat === ETAT_BOUCLE.NON_POSEE ? P.enStock : etat === ETAT_BOUCLE.POSEE ? P.poses : '',
});

/** Le nombre de lignes de chaque page : celui du formulaire officiel, toujours le même (les lignes manquantes restent vides). */
export const LIGNES_PAR_PAGE_REPERES = 30;

/** Les lignes d'une liste réparties en pages de trente, la dernière complétée de lignes vides ; une page vide quand il n'y a rien. */
export function pagesDesReperes(lignes: LigneListe[]): (LigneListe | undefined)[][] {
  const nombre = Math.max(1, Math.ceil(lignes.length / LIGNES_PAR_PAGE_REPERES));
  return Array.from({ length: nombre }, (_, p) =>
    Array.from({ length: LIGNES_PAR_PAGE_REPERES }, (_, i) => lignes[p * LIGNES_PAR_PAGE_REPERES + i]),
  );
}

/*
 * Le formulaire est dessiné sur une feuille de 595 × 842 (l'A4) : comme les autres formulaires, elle s'agrandit d'un tiers sur Android et
 * sur l'ordinateur (--k, voir htmlPdf.ts et bureau/print.ts). L'en-tête et le tableau de trente lignes remplissent la page.
 */
const STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; }
  .page-repere { width: calc(595px * var(--k, 1)); height: calc(842px * var(--k, 1)); position: relative; overflow: hidden; page-break-after: always; }
  .page-repere:last-child { page-break-after: auto; }
  .feuille { position: absolute; left: 0; top: 0; width: 595px; height: 842px; padding: 22px 28px 12px; transform-origin: 0 0; transform: scale(var(--k, 1)); }
  .haut { height: 66px; text-align: center; }
  h1 { margin: 0; font-size: 24px; line-height: 28px; font-weight: 700; letter-spacing: 0.3px; }
  h1 .fin { font-size: 22px; margin-left: 5px; }
  .edition { font-size: 13px; line-height: 15px; margin-top: 1px; }
  .sorte { font-size: 10px; line-height: 12px; color: #444; margin-top: 1px; }
  .entete { height: 62px; display: flex; justify-content: space-between; align-items: flex-start; margin-top: 4px; }
  .identite { display: grid; grid-template-columns: 52px auto; row-gap: 3px; font-size: 12.5px; line-height: 15px; }
  .identite .nom { text-transform: uppercase; }
  .cheptel { display: flex; align-items: center; gap: 7px; font-size: 12.5px; margin-right: 2px; }
  .cheptel .case { border: 1.4px solid #111; padding: 3px 12px; font-size: 15px; font-weight: 700; letter-spacing: 1px; min-width: 112px; text-align: center; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #111; }
  th { height: 36px; border: 1.1px solid #111; font-weight: 400; font-size: 9.5px; padding: 2px 3px; line-height: 1.2; }
  td { height: 20px; border: 1.1px solid #111; padding: 0 5px; font-size: 9px; line-height: 1.1; vertical-align: middle; overflow: hidden; }
  td.numero { font-size: 12px; font-weight: 700; padding-left: 9px; white-space: nowrap; }
  td.centre { text-align: center; font-size: 10px; }
  .note { font-size: 8.5px; line-height: 10px; margin-top: 3px; height: 22px; overflow: hidden; }
`;

const ligneHtml = (l: LigneListe | undefined): string =>
  l
    ? `<tr>
        <td class="numero">${identificationHtml(l.identification)}</td>
        <td class="centre">${echapper(l.naissance)}</td>
        <td class="centre">${echapper(l.pose)}</td>
        <td class="centre">${echapper(l.secondRepere)}</td>
        <td>${echapper(l.commentaires)}</td>
      </tr>`
    : '<tr><td class="numero"></td><td></td><td></td><td></td><td></td></tr>';

/** Une page de la liste : l'en-tête (titre, édition, nom, adresse, n° de cheptel), le tableau de trente lignes et la note. */
function pageHtml(
  liste: ListeImprimee,
  lignes: (LigneListe | undefined)[],
  identite: IdentiteListe,
  edition: string,
): string {
  return `<section class="page-repere"><div class="feuille">
  <div class="haut">
    <h1>${echapper(liste.titre.debut)}${liste.titre.fin ? ` <span class="fin">${echapper(liste.titre.fin)}</span>` : ''}</h1>
    <div class="edition">${echapper(P.edition(edition))}</div>
    <div class="sorte">${echapper(liste.sorte)} · ${echapper(liste.filtre)}</div>
  </div>
  <div class="entete">
    <div class="identite">
      <span>${echapper(P.nom)}</span><span class="nom">${echapper(identite.nom)}</span>
      <span>${echapper(P.adresse)}</span><span>${identite.adresse.map(echapper).join('<br/>')}</span>
    </div>
    <div class="cheptel"><span>${echapper(P.cheptel)}</span><span class="case">${echapper(identite.cheptel)}</span></div>
  </div>
  <table>
    <colgroup><col style="width:24.9%"/><col style="width:14.3%"/><col style="width:14.6%"/><col style="width:14.8%"/><col style="width:31.4%"/></colgroup>
    <thead><tr>
      <th>${echapper(P.colonnes.identification)}</th>
      <th>${echapper(P.colonnes.naissance)}</th>
      <th>${echapper(P.colonnes.pose)}</th>
      <th>${echapper(P.colonnes.secondRepere)}</th>
      <th>${echapper(P.colonnes.commentaires)}</th>
    </tr></thead>
    <tbody>${lignes.map(ligneHtml).join('')}</tbody>
  </table>
  <div class="note">${echapper(P.noteCommentaires)}</div>
</div></section>`;
}

/** Les listes de repères en HTML : par sorte de boucles, des pages de trente lignes, chacune avec son en-tête, comme le formulaire officiel. */
export function bouclesHtml(listes: ListeImprimee[], identite: IdentiteListe, edition: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
${listes.flatMap((l) => pagesDesReperes(l.lignes).map((page) => pageHtml(l, page, identite, edition))).join('\n')}
</body>
</html>`;
}

/** Imprime les listes de boucles telles que les filtres les montrent, présentées comme la « liste des repères » officielle. */
export async function exporterBouclesPdf(listes: ListeBoucles[]): Promise<void> {
  const settings = await getSettings();
  const espece = especeCourante();
  const indicatif = indicatifMarquagePar(settings.exploitation)(espece);
  const infos = settings.exploitation;
  const identite: IdentiteListe = {
    nom: infos?.nomExploitant?.trim() ?? '',
    adresse: (infos?.adresseExploitant ?? '')
      .split(/\n|,\s*(?=\d{5}\b)/)
      .map((l) => l.trim())
      .filter(Boolean),
    cheptel: identificationCheptel(infos, espece).numeroCheptel?.trim() ?? '',
  };
  const installation = infos?.dateInstallation;
  const ligneDe = (liste: ListeBoucles, b: BoucleStock) =>
    ligneDeLaListe(
      b,
      b.chevreId ? liste.animaux.get(b.chevreId) : undefined,
      b.chevreId && liste.morts.has(b.chevreId) ? (liste.sorties.get(b.chevreId) ?? { statut: '' }) : undefined,
      indicatif,
    );
  const imprimees: ListeImprimee[] = listes.flatMap((liste) => {
    // Les lots dans l'ordre d'achat (les boucles de remplacement gardent leur ordre : les poses, puis celles en stock).
    const boucles = estBoucleDeRemplacement(liste.article) ? liste.lignes : trierParLotAchat(liste.lignes);
    const base = { titre: titreDeLEtat(liste.etat), sorte: libelleDeLaSorte(liste.article) };
    const filtre = T.etat[liste.etat];
    if (!installation) return [{ ...base, filtre, lignes: boucles.map((b) => ligneDe(liste, b)) }];
    // Les boucles d'avant et d'après l'installation sont sur des pages différentes (une liste sans boucle d'un côté n'a pas de page).
    const { avant, apres } = separerSelonInstallation(boucles, installation, liste.toutes);
    const date = formatDateShortFR(installation);
    return [
      ...(avant.length > 0 ? [{ ...base, filtre: `${filtre} · ${P.avantInstallation(date)}`, lignes: avant.map((b) => ligneDe(liste, b)) }] : []),
      ...(apres.length > 0 || avant.length === 0
        ? [{ ...base, filtre: `${filtre} · ${P.depuisInstallation(date)}`, lignes: apres.map((b) => ligneDe(liste, b)) }]
        : []),
    ];
  });
  await ecrireEtPartagerPdf(
    bouclesHtml(imprimees, identite, formatDateShortFR(todayISO())),
    `${NOM_FICHIER_EXPORT_BOUCLES}.${FORMAT_EXPORT.PDF}`,
    P.titre,
    { sansMarges: true },
  );
}
