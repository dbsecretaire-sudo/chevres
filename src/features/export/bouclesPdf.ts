import type { Chevre } from '@/features/cheptel/types';
import { avecIndicatif } from '@/features/export/services/lignesExport';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { getSettings, identificationCheptel, indicatifMarquagePar } from '@/features/settings/settings';
import {
  libelleDeLaSorte,
  nePasPoser,
  texteDeLaRemarque,
  texteDeLaSortie,
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
    sortie ? texteDeLaSortie(sortie.statut, sortie.date) || P.oui : undefined,
  ].filter(Boolean);
  return {
    identification: avecIndicatif(b.numero, indicatif),
    naissance: animal?.dateNaissance?.slice(0, 4) ?? '',
    pose: b.datePose ? formatDateShortFR(b.datePose) : '',
    secondRepere: '',
    commentaires: commentaires.join(' — '),
  };
}

const titreDeLEtat = (etat: string): { debut: string; fin: string } => ({
  debut: P.titreListe,
  fin: etat === ETAT_BOUCLE.NON_POSEE ? P.enStock : etat === ETAT_BOUCLE.POSEE ? P.poses : '',
});

const STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 8mm 12mm 10mm; font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; }
  .liste { page-break-after: always; }
  .liste:last-child { page-break-after: auto; }
  h1 { margin: 0; text-align: center; font-size: 25px; font-weight: 700; letter-spacing: 0.3px; }
  h1 .fin { font-size: 22px; margin-left: 6px; }
  .edition { text-align: center; font-size: 14px; margin-top: 1px; }
  .sorte { text-align: center; font-size: 12px; color: #444; margin-top: 2px; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; margin: 14px 0 12px; }
  .identite { display: grid; grid-template-columns: 62px auto; row-gap: 6px; font-size: 14px; }
  .identite .nom { text-transform: uppercase; }
  .cheptel { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-right: 6mm; }
  .cheptel .case { border: 1.5px solid #111; padding: 4px 14px; font-size: 17px; font-weight: 700; letter-spacing: 1px; min-width: 130px; text-align: center; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.6px solid #111; }
  thead { display: table-header-group; }
  th { border: 1.2px solid #111; font-weight: 400; font-size: 13px; padding: 7px 4px; line-height: 1.25; }
  td { border: 1.2px solid #111; height: 9mm; padding: 2px 6px; font-size: 12.5px; vertical-align: middle; overflow-wrap: break-word; }
  tr { page-break-inside: avoid; }
  td.numero { font-size: 15px; font-weight: 700; padding-left: 12px; }
  td.centre { text-align: center; }
  .note { font-size: 10.5px; margin-top: 4px; line-height: 1.3; }
  .total { font-size: 10.5px; color: #555; margin-top: 3px; }
`;

function listeHtml(liste: ListeImprimee, identite: IdentiteListe, edition: string): string {
  const lignes = liste.lignes
    .map(
      (l) => `<tr>
        <td class="numero">${identificationHtml(l.identification)}</td>
        <td class="centre">${echapper(l.naissance)}</td>
        <td class="centre">${echapper(l.pose)}</td>
        <td class="centre">${echapper(l.secondRepere)}</td>
        <td>${echapper(l.commentaires)}</td>
      </tr>`,
    )
    .join('');
  return `<section class="liste">
  <h1>${echapper(liste.titre.debut)}${liste.titre.fin ? ` <span class="fin">${echapper(liste.titre.fin)}</span>` : ''}</h1>
  <div class="edition">${echapper(P.edition(edition))}</div>
  <div class="sorte">${echapper(liste.sorte)} · ${echapper(liste.filtre)}</div>
  <div class="entete">
    <div class="identite">
      <span>${echapper(P.nom)}</span><span class="nom">${echapper(identite.nom)}</span>
      <span>${echapper(P.adresse)}</span><span>${identite.adresse.map(echapper).join('<br/>')}</span>
    </div>
    <div class="cheptel"><span>${echapper(P.cheptel)}</span><span class="case">${echapper(identite.cheptel)}</span></div>
  </div>
  <table>
    <colgroup><col style="width:25%"/><col style="width:14%"/><col style="width:16%"/><col style="width:17%"/><col style="width:28%"/></colgroup>
    <thead><tr>
      <th>${echapper(P.colonnes.identification)}</th>
      <th>${echapper(P.colonnes.naissance)}</th>
      <th>${echapper(P.colonnes.pose)}</th>
      <th>${echapper(P.colonnes.secondRepere)}</th>
      <th>${echapper(P.colonnes.commentaires)}</th>
    </tr></thead>
    <tbody>${lignes || `<tr><td colspan="5" class="centre">${echapper(T.aucuneBoucle)}</td></tr>`}</tbody>
  </table>
  <div class="note">${echapper(P.noteCommentaires)}</div>
  <div class="total">${echapper(P.total(liste.lignes.length))}</div>
</section>`;
}

/** Les listes de repères en HTML : une « liste des repères » par sorte de boucles, sur le modèle du formulaire officiel. */
export function bouclesHtml(listes: ListeImprimee[], identite: IdentiteListe, edition: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
${listes.map((l) => listeHtml(l, identite, edition)).join('\n')}
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
  const imprimees: ListeImprimee[] = listes.map((liste) => ({
    titre: titreDeLEtat(liste.etat),
    sorte: libelleDeLaSorte(liste.article),
    filtre: T.etat[liste.etat],
    lignes: liste.lignes.map((b) =>
      ligneDeLaListe(
        b,
        b.chevreId ? liste.animaux.get(b.chevreId) : undefined,
        b.chevreId && liste.morts.has(b.chevreId) ? (liste.sorties.get(b.chevreId) ?? { statut: '' }) : undefined,
        indicatif,
      ),
    ),
  }));
  await ecrireEtPartagerPdf(
    bouclesHtml(imprimees, identite, formatDateShortFR(todayISO())),
    `${NOM_FICHIER_EXPORT_BOUCLES}.${FORMAT_EXPORT.PDF}`,
    P.titre,
  );
}
