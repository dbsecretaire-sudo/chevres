import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVisitesVeterinaire } from '@/features/exploitation/repository/visitesVeterinaire';
import {
  lignesDuCarnet,
  pagesDuCarnet,
  type LigneCarnet,
} from '@/features/exploitation/services/carnetSanitaire';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { getSettings, identificationCheptel } from '@/features/settings/settings';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { especeCourante, vocabulaire } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const D = TEXTES.carnet.document;

/** Les couleurs du formulaire papier : le vert du titre, le gris des bandeaux et des colonnes teintées. */
const VERT = '#5E9E2E';
const GRIS_BANDEAU = '#9A9A9A';
const GRIS_COLONNE = '#EDEDED';
const TRAIT = '#1F1F1F';

const date = (iso: string) => (iso ? formatDateFR(iso) : '');

/** Le n° de cheptel tel que le formulaire le donne : « FR » est déjà imprimé, on n'écrit que la suite. */
const chiffresDuCheptel = (numero: string | undefined): string => (numero ?? '').replace(/^\s*FR\s*/i, '').trim();

/**
 * Une intervention : deux rangées, comme le formulaire papier — en haut le médicament sur toute la largeur de sa case, en dessous la
 * voie, la dose et le rythme ; les autres cases s'étendent sur les deux rangées.
 */
/**
 * La taille du texte d'une case selon sa longueur : chaque ligne du carnet a une hauteur fixe, un texte long s'écrit plus petit (jusqu'à
 * quatre lignes d'écriture normale, puis plus petit) au lieu d'agrandir sa ligne ou de passer sur la page suivante.
 * `parLigne` : le nombre de caractères qui tiennent sur une ligne de la case, `lignes` : le nombre de lignes qu'elle porte.
 */
export function tailleDuTexte(texte: string | undefined, parLigne: number, lignes: number): '' | 't2' | 't3' {
  const longueur = (texte ?? '').length;
  if (longueur <= parLigne * lignes) return '';
  return longueur <= parLigne * lignes * 1.45 ? 't2' : 't3';
}

function ligneHtml(l: LigneCarnet | undefined): string {
  const intervenant = l ? [l.intervenant, l.intervenant ? D.veterinaire : ''].filter(Boolean).join(', ') : '';
  const c = (texte: string | undefined, classe = '', parLigne = 99, lignes = 4) =>
    `<td rowspan="2"${classe ? ` class="${classe}"` : ''}><div class="cl ${tailleDuTexte(texte, parLigne, lignes)}">${echapper(texte ?? '')}</div></td>`;
  return `<tr class="entree">
    ${c(l ? date(l.date) : '')}
    ${c(l ? l.animal || D.troupeauEntier : '', '', 13, 3)}
    ${c(l?.ordonnance, 'g', 11, 3)}
    ${c(l ? date(l.debut) : '', 'g')}
    ${c(l ? date(l.fin) : '', 'g')}
    <td colspan="3" class="med"><div class="cm ${tailleDuTexte(l?.medicament, 24, 2)}">${echapper(l?.medicament ?? '')}</div></td>
    ${c(l ? date(l.remise) : '', 'g')}
    ${c(l?.motif, 'gauche', 40, 4)}
    ${c(intervenant, 'gauche', 24, 4)}
  </tr>
  <tr class="sous">
    <td>${echapper(l?.voie ?? '')}</td><td>${echapper(l?.dose ?? '')}</td><td>${echapper(l?.rythme ?? '')}</td>
  </tr>`;
}

function pageHtml(
  lignes: (LigneCarnet | undefined)[],
  numero: number,
  atelier: string,
  cheptel: string,
): string {
  return `<section class="page">
  <div class="titre">${D.titre}</div>
  <div class="bandeau">
    <span class="mot">${D.atelier}</span><span class="case large">${echapper(atelier)}</span>
    <span class="mot">${D.numeroCheptel}</span><span class="fr">FR</span><span class="case">${echapper(cheptel)}</span>
    <span class="page-numero">${D.page} ${numero}</span>
  </div>
  <table>
    <colgroup>
      <col style="width:7.7%"/><col style="width:8.6%"/><col style="width:7.3%"/><col style="width:7.2%"/><col style="width:7.2%"/>
      <col style="width:5%"/><col style="width:4.9%"/><col style="width:5%"/>
      <col style="width:7.3%"/><col style="width:25%"/><col style="width:14.8%"/>
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2">${D.dateIntervention}</th>
        <th rowspan="2">${D.animal}</th>
        <th rowspan="2">${D.ordonnance}</th>
        <th rowspan="2">${D.debut}</th>
        <th rowspan="2">${D.fin}</th>
        <th colspan="3">${D.medicament}<br/><small>${D.medicamentPrecision}</small></th>
        <th rowspan="2">${D.remise}</th>
        <th rowspan="2">${D.motif}<br/><small>${D.motifPrecision}</small></th>
        <th rowspan="2">${D.intervenant}<br/><small>${D.intervenantPrecision}</small></th>
      </tr>
      <tr><th>${D.voie}</th><th>${D.dose}</th><th>${D.rythme}</th></tr>
    </thead>
    <tbody>${lignes.map(ligneHtml).join('')}</tbody>
  </table>
</section>`;
}

/** Le carnet sanitaire en HTML : une page A4 en paysage par neuf interventions, sur le modèle du formulaire papier, le contenu centré sur chaque page. */
export function carnetHtml(lignes: LigneCarnet[], atelier: string, cheptel: string): string {
  const pages = pagesDuCarnet(lignes);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  @page { size: A4 landscape; margin: 0; }
  body { font-family: Helvetica, Arial, sans-serif; color: ${TRAIT}; margin: 0; font-size: 9pt; }
  /* Chaque page est une feuille entière (297 × 210 mm, sans marge d'impression) dont le contenu est centré : mêmes marges partout. */
  .page { width: 297mm; height: 210mm; padding: 8mm 14mm; display: flex; flex-direction: column; justify-content: center; overflow: hidden; page-break-after: always; page-break-inside: avoid; }
  .page:last-child { page-break-after: auto; }
  .titre { background: ${VERT}; color: #fff; font-size: 26pt; font-weight: 900; letter-spacing: 3pt; text-align: center; padding: 4pt 0; }
  .bandeau { background: ${GRIS_BANDEAU}; color: #fff; display: flex; align-items: center; gap: 8pt; padding: 4pt 8pt; margin: 3pt 0 5pt; font-weight: 800; font-size: 12pt; }
  .bandeau .case { background: #fff; color: ${TRAIT}; min-width: 90pt; min-height: 18pt; padding: 2pt 6pt; font-weight: 600; }
  .bandeau .case.large { min-width: 150pt; }
  .bandeau .fr { color: ${TRAIT}; background: #fff; padding: 2pt 4pt; margin-right: -8pt; font-weight: 700; }
  .bandeau .page-numero { margin-left: auto; font-size: 14pt; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 2pt solid ${TRAIT}; }
  th, td { border: 1pt solid ${TRAIT}; padding: 2pt 4pt; text-align: center; vertical-align: middle; overflow-wrap: break-word; }
  th { font-weight: 700; font-size: 8.5pt; }
  th small { font-weight: 400; font-size: 7pt; }
  tbody td { font-size: 8.5pt; }
  tr.entree td { height: 8mm; border-top: 1.6pt solid ${TRAIT}; }
  tr.sous td { height: 7.2mm; }
  td.med { text-align: center; font-size: 8pt; }
  /* Une ligne a toujours la même hauteur : ce qui dépasse d'une case est écrit plus petit, puis coupé. */
  .cl { max-height: 14.5mm; overflow: hidden; line-height: 1.15; }
  .cm { max-height: 7mm; overflow: hidden; line-height: 1.15; }
  .cl.t2, .cm.t2 { font-size: 7pt; }
  .cl.t3, .cm.t3 { font-size: 6pt; }
  td.g { background: ${GRIS_COLONNE}; }
  td.gauche { text-align: left; }
</style>
</head>
<body>
${pages.map((p, i) => pageHtml(p, i + 1, atelier, cheptel)).join('\n')}
</body>
</html>`;
}

/** Génère le carnet sanitaire de l'espèce courante (d'après les factures et les visites du vétérinaire) et l'ouvre à l'envoi ou à l'impression. */
export async function exporterCarnetSanitairePdf(): Promise<void> {
  const espece = especeCourante();
  const [factures, visites, settings] = await Promise.all([
    listToutesFactures(),
    listToutesVisitesVeterinaire(),
    getSettings(),
  ]);
  const lignes = lignesDuCarnet(factures, visites, espece);
  const atelier = vocabulaire(espece).femelle.pluriel;
  const cheptel = chiffresDuCheptel(identificationCheptel(settings.exploitation, espece).numeroCheptel);
  await ecrireEtPartagerPdf(
    carnetHtml(lignes, atelier.charAt(0).toUpperCase() + atelier.slice(1), cheptel),
    `${D.fichier}.${FORMAT_EXPORT.PDF}`,
    TEXTES.carnet.generer,
    { paysage: true, sansMarges: true },
  );
}
