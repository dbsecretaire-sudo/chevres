import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import {
  effectifApres,
  suiviMouvements,
  sousTotaux,
  type Effectifs,
  type LigneMouvement,
  type SuiviAnnuel,
} from '@/features/cheptel/services/suiviMouvements';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { MODELE_SUIVI_2026 } from '@/features/export/modeles/suivi2026';
import { echapper, ecrireEtPartagerPdf, ecrirePdfBase64EtPartager } from '@/features/export/services/htmlPdf';
import { remplirModele } from '@/features/export/services/modelePdf';
import { getSettings, type InfosExploitation } from '@/features/settings/settings';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { NOM_FICHIER_EXPORT_SUIVI_MOUVEMENTS, FORMAT_EXPORT } from '@/shared/constants/export';
import {
  CASES_NUMERO_EXPLOITATION,
  CASES_NUMERO_PACAGE,
  CASES_NUMERO_PAGE,
  CASES_NUMERO_SIRET,
  CATEGORIE_SUIVI,
  COLONNE_SUIVI_PAR_ESPECE,
  LIGNES_PAR_PAGE_SUIVI,
  PREFIXE_NUMERO_EXPLOITATION,
  type ColonneSuivi,
} from '@/shared/constants/suiviMouvements';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { loadAllYears } from '@/shared/storage/localStore';
import { couleursFormulairePac as bleu, colors } from '@/shared/theme/colors';
import { formatDateFR, todayISO } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.suiviMouvements;
const F = T.formulaire;

/** Ce qui s'inscrit dans l'en-tête du formulaire (chaque numéro dans ses cases). */
export interface IdentiteSuivi {
  numeroPacage: string;
  siret: string;
  numeroExploitation: string;
  nom: string;
}

/** Les espèces que le formulaire couvre : les brebis et les chèvres. */
export const especeDuSuivi = (espece: string): boolean =>
  espece === TYPE_ANIMAL_ETABLISSEMENT.CHEVRES || espece === TYPE_ANIMAL_ETABLISSEMENT.BREBIS;

/** Les chiffres et lettres d'un numéro, sans espace ni séparateur. */
const compact = (valeur?: string): string => (valeur ?? '').replace(/[\s.-]/g, '').toUpperCase();

export function identiteDuSuivi(infos: InfosExploitation | undefined): IdentiteSuivi {
  const exploitation = compact(infos?.numeroExploitation);
  return {
    numeroPacage: compact(infos?.numeroPacage),
    siret: compact(infos?.siret),
    // Le « FR » est imprimé sur le formulaire : seules les cases qui suivent s'écrivent.
    numeroExploitation: exploitation.startsWith(PREFIXE_NUMERO_EXPLOITATION)
      ? exploitation.slice(PREFIXE_NUMERO_EXPLOITATION.length)
      : exploitation,
    nom: (infos?.nomExploitant ?? '').trim(),
  };
}

/** Un numéro écrit dans ses cases (une par caractère, les cases en trop restent vides) ; un préfixe imprimé (« FR ») s'écrit dans les premières. */
const casesHtml = (
  valeur: string,
  nombre: number,
  variante: 'noire' | 'bleue' = 'noire',
  prefixe = '',
): string =>
  `<span class="cases ${variante}">${[...prefixe].map((c) => `<i class="pre">${echapper(c)}</i>`).join('')}${Array.from({ length: nombre }, (_, k) => `<i>${echapper(valeur[k] ?? '')}</i>`).join('')}</span>`;

/** Un nombre dans une case de mouvement : rien quand il est nul. */
const nombreHtml = (n: number | undefined): string => (n ? String(n) : '');

/** Les colonnes de la page : chaque catégorie avec la colonne (brebis ou chèvres) que l'espèce remplit. */
function colonnesDeLaPage(colonne: ColonneSuivi) {
  return [
    { categorie: CATEGORIE_SUIVI.JEUNES, remplie: true },
    { categorie: CATEGORIE_SUIVI.FEMELLES, remplie: colonne === COLONNE_SUIVI_PAR_ESPECE.brebis },
    { categorie: CATEGORIE_SUIVI.FEMELLES, remplie: colonne === COLONNE_SUIVI_PAR_ESPECE.chevres },
    { categorie: CATEGORIE_SUIVI.MALES, remplie: true },
  ];
}

/** Une note de bas de page : son numéro en bleu, puis son intitulé souligné (le texte avant les deux-points) et la suite. */
function noteHtml(numero: number, texte: string): string {
  const coupure = texte.indexOf(' : ');
  const intitule = coupure > 0 ? texte.slice(0, coupure) : '';
  const suite = coupure > 0 ? texte.slice(coupure) : texte;
  return `<p><b class="n">(${numero})</b> ${intitule ? `<u>${echapper(intitule)}</u>` : ''}${echapper(suite)}</p>`;
}

/** Une page (une feuille) du formulaire. */
interface Feuille {
  annee: number;
  numero: number;
  total: number;
  lignes: LigneMouvement[];
  effectifDepart: Effectifs;
  /** La date où l'effectif de départ de la page est arrêté (« 1er janvier » pour la première page). */
  libelleDepart: string;
  /** La date de l'effectif de fin de page. */
  dateFin: string;
}

/** Découpe une année en feuilles de douze lignes ; chaque feuille reprend l'effectif où la précédente s'est arrêtée. */
export function feuillesDuSuivi(suivi: SuiviAnnuel, aujourdhui: string): Feuille[] {
  const morceaux: LigneMouvement[][] = [];
  for (let i = 0; i < suivi.lignes.length; i += LIGNES_PAR_PAGE_SUIVI)
    morceaux.push(suivi.lignes.slice(i, i + LIGNES_PAR_PAGE_SUIVI));
  if (morceaux.length === 0) morceaux.push([]);
  const finDeLAnnee = `${suivi.annee}-12-31`;
  const dernierJour = finDeLAnnee < aujourdhui ? finDeLAnnee : aujourdhui;
  let depart = suivi.effectifDebut;
  let libelleDepart = F.premierJanvier(suivi.annee);
  return morceaux.map((lignes, i) => {
    const dernier = i === morceaux.length - 1;
    const feuille: Feuille = {
      annee: suivi.annee,
      numero: i + 1,
      total: morceaux.length,
      lignes,
      effectifDepart: depart,
      libelleDepart,
      dateFin: dernier ? dernierJour : (lignes[lignes.length - 1]?.date ?? dernierJour),
    };
    depart = effectifApres(depart, lignes);
    libelleDepart = formatDateFR(feuille.dateFin);
    return feuille;
  });
}

function feuilleHtml(f: Feuille, identite: IdentiteSuivi, colonne: ColonneSuivi): string {
  const colonnes = colonnesDeLaPage(colonne);
  const totaux = sousTotaux(f.lignes);
  const fin = effectifApres(f.effectifDepart, f.lignes);
  const teinte = (k: number) => (k === 0 || k === 3 ? ' teinte' : '');
  /** Le « 1er » du formulaire s'écrit avec un « er » en exposant. */
  const avecExposant = (texte: string) => echapper(texte).replace(/^1er /, '1<sup>er</sup> ');
  /** Un intitulé coupé comme sur le formulaire : le séparateur devient un retour à la ligne. */
  const surDeuxLignes = (texte: string, separateur = ' ') =>
    echapper(texte).replace(separateur, `<br>${separateur.trimStart()}`).replace(/^<br>/, '');
  const numero = (n: number) => `<span class="n">(${n})</span>`;

  const enteteCategorie = (k: number, titre: string) =>
    `<th colspan="2" class="cat sep${teinte(k)}">${titre}</th>`;
  const lignesDeDonnees = Array.from({ length: LIGNES_PAR_PAGE_SUIVI }, (_, i) => f.lignes[i]);
  const nombres = (l: LigneMouvement | undefined) =>
    colonnes
      .map((c, k) => {
        const e = l && c.remplie ? nombreHtml(l.entrees[c.categorie]) : '';
        const s = l && c.remplie ? nombreHtml(l.sorties[c.categorie]) : '';
        return `<td class="nb sep${teinte(k)}">${e}</td><td class="nb${teinte(k)}">${s}</td>`;
      })
      .join('');

  const corps = lignesDeDonnees
    .map(
      (l) =>
        `<tr class="ligne"><td class="date">${l ? formatDateFR(l.date) : ''}</td>${nombres(l)}<td class="cause sep">${l ? echapper(l.cause) : ''}</td><td class="sep"></td><td class="nom sep">${l?.nom ? echapper(l.nom) : ''}</td></tr>`,
    )
    .join('');

  const effectifs = (valeurs: Effectifs) =>
    colonnes
      .map(
        (c, k) =>
          `<td colspan="2" class="effectif sep${teinte(k)}">${c.remplie ? valeurs[c.categorie] : ''}</td>`,
      )
      .join('');
  const sousTotauxCases = colonnes
    .map((c, k) => {
      const e = c.remplie ? nombreHtml(totaux.entrees[c.categorie]) : '';
      const s = c.remplie ? nombreHtml(totaux.sorties[c.categorie]) : '';
      return `<td class="nb pale sep${teinte(k)}">${e}</td><td class="nb pale${teinte(k)}">${s}</td>`;
    })
    .join('');

  const notesGauche = [noteHtml(1, F.notes.jeunes), noteHtml(2, F.notes.nombre)].join('');
  const notesDroite = [
    noteHtml(3, F.notes.eligibles(f.annee)),
    noteHtml(4, F.notes.causesEntree),
    noteHtml(5, F.notes.causesSortie),
    noteHtml(6, F.notes.nExploitation),
    noteHtml(7, F.notes.effectif),
  ].join('');

  return `<section class="feuille">
  <div class="haut">
    <div class="t1"><span class="dp">${echapper(F.dossier)}</span> <span class="pt">•</span> <span class="camp">${echapper(F.campagne(f.annee))}</span></div>
    <div class="t2">${echapper(F.titre)}</div>
    <div class="page">${echapper(F.page)}<br>${casesHtml(String(f.numero), CASES_NUMERO_PAGE, 'bleue')} / ${casesHtml(String(f.total), CASES_NUMERO_PAGE, 'bleue')}</div>
  </div>
  <div class="ident-titre">${echapper(F.identification)}</div>
  <div class="ident">
    <div class="ligne-ident">
      <span>${echapper(F.nPacage)} ${casesHtml(identite.numeroPacage, CASES_NUMERO_PACAGE)}</span>
      <span>${echapper(F.nSiret)} ${casesHtml(identite.siret, CASES_NUMERO_SIRET)}</span>
      <span>${echapper(F.nExploitation)} ${casesHtml(identite.numeroExploitation, CASES_NUMERO_EXPLOITATION, 'noire', PREFIXE_NUMERO_EXPLOITATION)}</span>
    </div>
    <div class="ligne-nom">${echapper(F.nomPrenom)} <span class="pointilles">${echapper(identite.nom)}</span></div>
  </div>
  <table class="suivi">
    <colgroup>
      <col style="width:9.6%" />
      ${'<col style="width:5.95%" />'.repeat(8)}
      <col style="width:7%" /><col style="width:16.5%" /><col style="width:19.3%" />
    </colgroup>
    <thead>
      <tr class="ligne1">
        <th class="categories teinte">${echapper(F.categories)}</th>
        ${enteteCategorie(0, `${echapper(F.jeunes)} ${numero(1)}<br>${echapper(F.jeunesPrecision)}`)}
        ${enteteCategorie(1, `${surDeuxLignes(F.brebis, ' à ')} ${numero(3)}`)}
        ${enteteCategorie(2, `${surDeuxLignes(F.chevres, ' à ')} ${numero(3)}`)}
        ${enteteCategorie(3, surDeuxLignes(F.beliersBoucs, ' ou '))}
        <th rowspan="3" class="large causes sep">${echapper(F.causes)}<br>d’ENTRÉES<br>${numero(4)}<br>${echapper(F.causesOu)}<br>${echapper(F.causesSorties)}<br>${numero(5)}<br>${echapper(F.causesLot)}</th>
        <th rowspan="3" class="large sep haut-droit nexpl">N°<br>D’EXPLOITATION<br>${numero(6)}</th>
        <th rowspan="3" class="large sep haut-droit nomcol">${echapper(F.nomAcheteur)}<br>${echapper(F.nomVendeur)}</th>
      </tr>
      <tr class="ligne2">
        <th class="debut">${echapper(F.effectifsAu)}<br>${avecExposant(f.libelleDepart)}</th>
        ${effectifs(f.effectifDepart)}
      </tr>
      <tr class="ligne3">
        <th class="debut">${echapper(F.dateDuMouvement).replace(' du ', '<br>du ')}</th>
        ${colonnes
          .map(
            (_, k) =>
              `<th class="nbtitre sep${teinte(k)}">${surDeuxLignes(F.nombreEntrees)}<br>${numero(2)}</th><th class="nbtitre${teinte(k)}">${surDeuxLignes(F.nombreSorties)}<br>${numero(2)}</th>`,
          )
          .join('')}
      </tr>
    </thead>
    <tbody>${corps}</tbody>
  </table>
  <div class="bas">
    <div class="bas-gauche">
      <table class="suivi totaux">
        <colgroup><col style="width:16.8%" />${'<col style="width:10.4%" />'.repeat(8)}</colgroup>
        <tr><th class="debut">${echapper(F.sousTotaux)}</th>${sousTotauxCases}</tr>
        <tr><th class="debut">${echapper(F.effectifsDe)} ${numero(7)} ${echapper(F.effectifsAuDate)}<br><span class="dateFin">${echapper(formatDateFR(f.dateFin))}</span></th>${effectifs(fin)}</tr>
      </table>
      <div class="notes">${notesGauche}</div>
    </div>
    <div class="bas-droite notes">${notesDroite}</div>
  </div>
</section>`;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: ${bleu.texte}; }
  /* Comme le formulaire papier : une page A4 en portrait dont le contenu est tourné d'un quart de tour (il se lit en paysage). */
  /* Sur l'ordinateur, la page s'agrandit d'un tiers (--k, voir bureau/print.ts) : le formulaire garde ses proportions. */
  .page-pac { width: calc(595px * var(--k, 1)); height: calc(842px * var(--k, 1)); position: relative; overflow: hidden; page-break-after: always; }
  .page-pac:last-child { page-break-after: auto; }
  .feuille { width: 842px; height: 595px; padding: 12px 22px 10px; overflow: hidden; position: absolute; left: 0; top: 0; transform-origin: 0 0; transform: scale(var(--k, 1)) translate(0, 842px) rotate(-90deg); }
  /* Les titres sont centrés, le numéro de page est dans le coin. */
  .haut { position: relative; text-align: center; height: 50px; }
  .t1 { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 17px; line-height: 1.15; color: ${bleu.titre}; }
  .t1 .dp { color: ${bleu.titre}; }
  .t1 .pt { color: ${bleu.titreClair}; font-size: 14px; }
  .t1 .camp { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${bleu.titreClair}; }
  .t2 { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 23px; line-height: 1.1; color: ${bleu.texte}; }
  .page { position: absolute; right: 0; top: 2px; font-size: 9px; font-weight: 700; text-align: center; }
  .ident-titre { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 13px; color: ${bleu.trait}; margin: 2px 0 1px; }
  .ident { border: 2.6px solid ${bleu.cadreIdent}; background: ${bleu.fondCadre}; padding: 7px 10px 6px; font-size: 9.6px; }
  .ligne-ident { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
  .ligne-ident > span { display: inline-flex; align-items: flex-end; gap: 4px; }
  .ligne-nom { display: flex; align-items: flex-end; gap: 4px; }
  .pointilles { flex: 1; border-bottom: 1px dotted ${bleu.trait}; min-height: 12px; padding-left: 4px; font-weight: 700; }
  /* Les cases : un trait en bas, une petite graduation entre deux caractères et un trait plus haut aux deux bouts. */
  .cases { display: inline-flex; border-bottom: 0.8px solid ${bleu.texte}; align-items: flex-end; }
  .cases i { display: inline-block; width: 11px; height: 15px; font-style: normal; font-size: 9.6px; text-align: center; line-height: 15px; background: linear-gradient(${bleu.texte}, ${bleu.texte}) right bottom / 0.8px 26% no-repeat; }
  .cases i:first-child { background: linear-gradient(${bleu.texte}, ${bleu.texte}) left bottom / 0.8px 100% no-repeat, linear-gradient(${bleu.texte}, ${bleu.texte}) right bottom / 0.8px 26% no-repeat; }
  .cases i:last-child { background: linear-gradient(${bleu.texte}, ${bleu.texte}) right bottom / 0.8px 100% no-repeat; }
  .cases i.pre { line-height: 9px; }
  .cases.bleue { border-bottom-color: ${bleu.trait}; }
  .cases.bleue i { background: linear-gradient(${bleu.trait}, ${bleu.trait}) right bottom / 0.8px 26% no-repeat; }
  .cases.bleue i:first-child { background: linear-gradient(${bleu.trait}, ${bleu.trait}) left bottom / 0.8px 100% no-repeat, linear-gradient(${bleu.trait}, ${bleu.trait}) right bottom / 0.8px 26% no-repeat; }
  .cases.bleue i:last-child { background: linear-gradient(${bleu.trait}, ${bleu.trait}) right bottom / 0.8px 100% no-repeat; }
  table.suivi { width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 6px; border: 3.6px solid ${bleu.cadre}; background: ${colors.blanc}; }
  table.suivi th, table.suivi td { border: 0.9px solid ${bleu.trait}; text-align: center; vertical-align: middle; padding: 0; overflow: hidden; }
  table.suivi .sep { border-left: 2px solid ${bleu.trait}; }
  table.suivi th { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 9.6px; line-height: 1.14; color: ${bleu.texte}; padding: 1px 2px; }
  tr.ligne2 th, tr.ligne2 td { border-bottom: 2px solid ${bleu.trait}; }
  tr.ligne3 th { border-bottom: 2px solid ${bleu.trait}; }
  th.teinte, td.teinte { background: ${bleu.entete}; }
  tbody td.teinte, td.effectif.teinte, td.nb.pale.teinte { background: ${bleu.case}; }
  th.categories { font-size: 10.4px; height: 24px; }
  th.cat { height: 24px; font-size: 10.4px; }
  th.debut { font-size: 9.2px; line-height: 1.15; }
  th.large { font-size: 9px; }
  th.causes { vertical-align: top; padding-top: 3px; font-size: 8.8px; }
  th.haut-droit { vertical-align: top; }
  th.nexpl { padding-top: 22px; }
  th.nomcol { padding-top: 30px; }
  th.nbtitre { font-size: 8.6px; height: 36px; }
  .n { color: ${bleu.trait}; font-weight: 700; font-family: 'Times New Roman', Times, serif; }
  td.effectif { height: 26px; font-size: 11px; font-weight: 700; }
  tr.ligne td { height: 21.6px; font-size: 9.6px; }
  td.date { font-size: 9px; }
  td.cause { font-weight: 700; }
  td.nom { font-size: 8.6px; text-align: left; padding-left: 4px; white-space: nowrap; }
  td.pale { background: ${bleu.case}; height: 20px; font-size: 9.6px; font-weight: 700; }
  .bas { display: flex; align-items: flex-start; }
  .bas-gauche { width: 57.2%; }
  .bas-droite { width: 42.8%; padding: 2px 0 0 12px; }
  .bas-gauche table.suivi { margin-top: 0; border-top: 0; }
  .dateFin { font-family: Arial, Helvetica, sans-serif; font-size: 8.6px; font-weight: 700; }
  .notes { font-size: 6.9px; line-height: 1.22; }
  .notes p { margin: 0 0 1.5px; }
  .bas-gauche .notes { padding-top: 3px; }
  .notes .n { font-family: Arial, Helvetica, sans-serif; }
  .notes u { text-decoration: underline; }
`;

/** Le document complet : une feuille par douze mouvements, pour chaque année demandée. */
export function suiviMouvementsHtml(
  suivis: SuiviAnnuel[],
  identite: IdentiteSuivi,
  colonne: ColonneSuivi,
  aujourdhui: string = todayISO(),
): string {
  const feuilles = suivis.flatMap((s) => feuillesDuSuivi(s, aujourdhui));
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
${feuilles.map((f) => `<div class="page-pac">${feuilleHtml(f, identite, colonne)}</div>`).join('\n')}
</body>
</html>`;
}

/** La colonne (brebis ou chèvres) que remplit l'espèce courante. */
export const colonneDeLEspece = (espece: string): ColonneSuivi =>
  espece === TYPE_ANIMAL_ETABLISSEMENT.BREBIS
    ? COLONNE_SUIVI_PAR_ESPECE.brebis
    : COLONNE_SUIVI_PAR_ESPECE.chevres;

/** Les coordonnées du formulaire officiel de la campagne 2026, relevées sur le PDF de la DDT(M). La feuille est lue en paysage : l'abscisse va vers la droite, l'ordonnée vers le haut (en points) ; celles de la page du PDF, en portrait, sont tournées d'un quart de tour (voir remplirModele). */
const OFFICIEL = {
  /** La largeur de la page en portrait : l'ordonnée d'un point en paysage est cette largeur moins son abscisse dans la page. */
  largeurPage: 595.276,
  /** Les limites des colonnes de nombres, de gauche à droite : l'entrée et la sortie de chaque catégorie (jeunes, brebis, chèvres, boucs). */
  bornes: [98.1, 144.8, 191.6, 238.4, 285.2, 331.9, 378.7, 425.5, 472.2],
  /** La colonne de la date, celle de la cause, celle du nom de l'acheteur ou du vendeur. */
  date: { debut: 18.7, fin: 98.1 },
  cause: { debut: 472.2, fin: 527.5 },
  nom: { debut: 657.9, largeur: 146 },
  /** Les lignes : la position (dans la page) du haut de la première, et leur hauteur. */
  premiereLigne: 238.0,
  hauteurLigne: 21.26,
  /** Le milieu (dans la page) des lignes des sous totaux, des effectifs de départ et des effectifs de fin. */
  sousTotaux: 503.7,
  effectifDepart: 191.2,
  effectifFin: 531.35,
  /** L'identification : la ligne de base (dans la page) du premier rang, puis des cases : début (abscisse) et largeur d'une case. */
  identification: { page: 109.9, pacage: { x: 153.6, pas: 120.2 / 9 }, siret: { x: 328.1, pas: 187 / 14 }, exploitation: { x: 600.3 + 2 * (133.6 / 10), pas: 133.6 / 10 } },
  nom_prenom: { page: 129.9, x: 320, largeur: 400 },
  numeroPage: { page: 137.4, numero: { x: 754.0, pas: 10.6 }, total: { x: 782.9, pas: 10.6 } },
  /** La date de l'effectif de fin : huit cases (jour, mois, année). */
  dateFin: { page: 543.3, x: 23.3, pas: 70.2 / 8 },
  /** Le « 1er janvier 2026 » imprimé au-dessus de l'effectif de départ : recouvert à partir de la deuxième page. */
  libelleDepart: { debut: 22, largeur: 74, haut: 203.5, hauteur: 12.5, baseline: 201.2 },
  /** Les chiffres des cases se relèvent un peu : ils ne touchent pas le trait du bas. */
  releveCases: 1.3,
} as const;

/** « JJMMAAAA » d'une date AAAA-MM-JJ, pour les huit cases de la date de fin. */
const jjmmaaaa = (iso: string): string => iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4);

/**
 * Remplit la feuille officielle de la campagne 2026 (le document de suivi de la DDT(M), embarqué dans l'application) : une feuille par douze
 * mouvements, avec l'identification, les dates, les nombres, les sous totaux, les effectifs et la date de fin. Le PDF garde son aspect
 * exact : seules les valeurs s'y ajoutent. Rend le PDF en base64.
 */
export function remplirSuiviMouvements(
  suivis: SuiviAnnuel[],
  identite: IdentiteSuivi,
  colonne: ColonneSuivi,
  aujourdhui: string = todayISO(),
): Promise<string> {
  const feuilles = suivis.flatMap((s) => feuillesDuSuivi(s, aujourdhui));
  const O = OFFICIEL;
  const W = O.largeurPage;
  const enY = (pagePosition: number) => W - pagePosition;
  const colonnes = colonnesDeLaPage(colonne);
  const milieuColonne = (k: number, sortie: boolean) => (O.bornes[2 * k + (sortie ? 1 : 0)] + O.bornes[2 * k + (sortie ? 2 : 1)]) / 2;
  const milieuCategorie = (k: number) => (O.bornes[2 * k] + O.bornes[2 * k + 2]) / 2;
  const ligneDeBase = (milieuPage: number, taille: number) => enY(milieuPage) - taille * 0.36;
  const sur = (n: number | undefined): string => (n ? String(n) : '');

  return remplirModele(
    MODELE_SUIVI_2026,
    feuilles.map((feuille) => [feuille]),
    ({ cases, ajuste, centre, blanc, texte }, feuille) => {
      const releve = O.releveCases;
      // L'identification.
      const base = enY(O.identification.page) + releve;
      cases(O.identification.pacage.x, base, O.identification.pacage.pas, identite.numeroPacage, 10);
      cases(O.identification.siret.x, base, O.identification.siret.pas, identite.siret, 10);
      cases(O.identification.exploitation.x, base, O.identification.exploitation.pas, identite.numeroExploitation, 10);
      ajuste(O.nom_prenom.x, enY(O.nom_prenom.page) + 1.5, identite.nom, O.nom_prenom.largeur, 10);
      // Le numéro de la page, sur le nombre de pages.
      const basePage = enY(O.numeroPage.page) + releve;
      cases(O.numeroPage.numero.x, basePage, O.numeroPage.numero.pas, String(feuille.numero).padStart(2, ' '), 10);
      cases(O.numeroPage.total.x, basePage, O.numeroPage.total.pas, String(feuille.total).padStart(2, ' '), 10);

      // Les effectifs de départ ; à partir de la deuxième page, la date imprimée (« 1er janvier ») est remplacée par celle de la page.
      if (feuille.numero > 1) {
        const l = O.libelleDepart;
        blanc(l.debut, enY(l.haut), l.largeur, l.hauteur);
        texte(l.debut + 2, enY(l.baseline), feuille.libelleDepart, 7.5, true);
      }
      const fin = effectifApres(feuille.effectifDepart, feuille.lignes);
      const totaux = sousTotaux(feuille.lignes);
      colonnes.forEach((c, k) => {
        if (!c.remplie) return;
        centre(milieuCategorie(k), ligneDeBase(O.effectifDepart, 11), String(feuille.effectifDepart[c.categorie]), 11, true);
        centre(milieuCategorie(k), ligneDeBase(O.effectifFin, 11), String(fin[c.categorie]), 11, true);
        centre(milieuColonne(k, false), ligneDeBase(O.sousTotaux, 10), sur(totaux.entrees[c.categorie]), 10);
        centre(milieuColonne(k, true), ligneDeBase(O.sousTotaux, 10), sur(totaux.sorties[c.categorie]), 10);
      });
      cases(O.dateFin.x, enY(O.dateFin.page) + releve, O.dateFin.pas, jjmmaaaa(feuille.dateFin), 9.5);

      // Les mouvements, une ligne chacun.
      feuille.lignes.forEach((ligne, i) => {
        const milieu = O.premiereLigne + O.hauteurLigne * (i + 0.5);
        const y = ligneDeBase(milieu, 10);
        centre((O.date.debut + O.date.fin) / 2, y, formatDateFR(ligne.date), 9);
        colonnes.forEach((c, k) => {
          if (!c.remplie) return;
          centre(milieuColonne(k, false), y, sur(ligne.entrees[c.categorie]), 10);
          centre(milieuColonne(k, true), y, sur(ligne.sorties[c.categorie]), 10);
        });
        centre((O.cause.debut + O.cause.fin) / 2, y, ligne.cause, 10, true);
        if (ligne.nom) ajuste(O.nom.debut + 4, y, ligne.nom, O.nom.largeur, 9);
      });
    },
    { rotation: 90 },
  );
}

/** Les campagnes dont la feuille officielle est embarquée : les autres suivis sont dessinés d'après le même modèle. */
export const CAMPAGNES_OFFICIELLES_SUIVI: readonly number[] = [2026];

/** Crée le PDF du suivi des mouvements pour les années demandées (une feuille par douze mouvements) et le partage. */
export async function exporterSuiviMouvementsPdf(annees: number[]): Promise<void> {
  const [tous, ventes, settings] = await Promise.all([
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL),
    listToutesVentes(),
    getSettings(),
  ]);
  const animaux = deEspeceCourante(tous);
  const libelles = { abattoir: T.abattoir, autoConsommation: T.autoConsommation };
  const suivis = annees.map((annee) => suiviMouvements(animaux, ventes, annee, libelles));
  const identite = identiteDuSuivi(settings.exploitation);
  const colonne = colonneDeLEspece(especeCourante());
  const periode = annees.length === 1 ? `${annees[0]}` : `${annees[0]}-${annees[annees.length - 1]}`;
  const nomFichier = `${NOM_FICHIER_EXPORT_SUIVI_MOUVEMENTS}_${periode}.${FORMAT_EXPORT.PDF}`;
  // La campagne 2026 s'écrit sur la feuille officielle ; sinon le suivi est dessiné d'après le même modèle.
  if (annees.every((a) => CAMPAGNES_OFFICIELLES_SUIVI.includes(a))) {
    await ecrirePdfBase64EtPartager(await remplirSuiviMouvements(suivis, identite, colonne), nomFichier, T.titre);
    return;
  }
  const html = suiviMouvementsHtml(suivis, identite, colonne);
  await ecrireEtPartagerPdf(html, nomFichier, T.titre, { sansMarges: true });
}
