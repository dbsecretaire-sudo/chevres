import { pertesDeLAnnee, type PerteDuJour } from '@/features/cheptel/services/suiviMouvements';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { colonneDeLEspece, identiteDuSuivi, type IdentiteSuivi } from '@/features/export/suiviMouvementsPdf';
import { getSettings } from '@/features/settings/settings';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_BORDEREAUX_PERTE } from '@/shared/constants/export';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import {
  CASES_ANNEE,
  CASES_JOUR_MOIS,
  CASES_NOMBRE_BORDEREAU,
  CASES_NUMERO_PACAGE,
  CASES_NUMERO_SIRET,
  COLONNE_SUIVI_PAR_ESPECE,
  type ColonneSuivi,
} from '@/shared/constants/suiviMouvements';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { loadAllYears } from '@/shared/storage/localStore';
import { couleursFormulairePac as bleu, colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.suiviMouvements;
const B = T.bordereauPerte;

/** Une perte déclarée sur un bordereau : le jour (AAAA-MM-JJ) et le nombre de femelles perdues. */
export type PerteBordereau = PerteDuJour;

/** Les cases d'un champ à remplir (un chiffre par case), de la largeur d'une case en mm ; les nombres se rangent à droite. */
function casesHtml(valeur: string, nombre: number, largeurMm: number, aDroite = false): string {
  const caracteres = aDroite ? valeur.padStart(nombre, ' ') : valeur;
  return `<span class="cs">${Array.from({ length: nombre }, (_, i) => `<i style="width:${(largeurMm * PX_PAR_MM).toFixed(2)}px">${echapper((caracteres[i] ?? '').trim())}</i>`).join('')}</span>`;
}

/** Les étoiles du drapeau européen : douze en cercle, dessinées en SVG pour ne dépendre d'aucune police. */
export function drapeauEuropeHtml(): string {
  const etoile = (cx: number, cy: number, r: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const rayon = i % 2 === 0 ? r : r * 0.4;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      return `${(cx + rayon * Math.cos(angle)).toFixed(2)},${(cy + rayon * Math.sin(angle)).toFixed(2)}`;
    }).join(' ');
  const etoiles = Array.from({ length: 12 }, (_, i) => {
    const angle = (Math.PI / 6) * i;
    return `<polygon points="${etoile(50 + 22 * Math.sin(angle), 33 - 22 * Math.cos(angle), 3.6)}" />`;
  }).join('');
  return `<svg viewBox="0 0 100 66" class="drapeau"><rect x="1" y="1" width="98" height="64" fill="none" stroke="${colors.noir}" stroke-width="2" /><g fill="${colors.noir}">${etoiles}</g></svg>`;
}

/** Une case à cocher du bordereau, cochée ou non. */
const caseACocher = (cochee: boolean): string => `<span class="boite">${cochee ? '✕' : ''}</span>`;

const jourMois = (date: string) => ({
  jour: date.slice(8, 10),
  mois: date.slice(5, 7),
  annee: date.slice(0, 4),
});

/** Un bordereau de perte : la moitié d'une page A4, avec les numéros de l'exploitation et la perte déjà remplis. */
function bordereauHtml(
  perte: PerteBordereau,
  identite: IdentiteSuivi,
  colonne: ColonneSuivi,
  coupe: boolean,
): string {
  const { jour, mois, annee } = jourMois(perte.date);
  const nombre = String(perte.nombre);
  const brebis = colonne === COLONNE_SUIVI_PAR_ESPECE.brebis ? nombre : '';
  const chevres = colonne === COLONNE_SUIVI_PAR_ESPECE.chevres ? nombre : '';
  const date = (j: string, m: string) =>
    `${casesHtml(j, CASES_JOUR_MOIS, 5)} <span class="bleu">/</span> ${casesHtml(m, CASES_JOUR_MOIS, 5)} <span class="bleu">/ ${echapper(annee)}</span>`;
  const dateSansRemplissage = `${casesHtml('', CASES_JOUR_MOIS, 5)} <span class="bleu">/</span> ${casesHtml('', CASES_JOUR_MOIS, 5)} <span class="bleu">/ ${echapper(annee)}</span>`;

  return `<div class="slot">
  <div class="entete">
    <div class="ministere">
      <div class="marque"><i></i><i></i></div>
      <b>${B.ministere.map(echapper).join('<br>')}</b>
      <em>${B.devise.map(echapper).join('<br>')}</em>
    </div>
    <div class="centre">
      <div class="direction">${echapper(B.direction)}</div>
      <div class="camp">${echapper(B.campagne(Number(annee)))}</div>
      <div class="titre">${echapper(B.titre)}</div>
      <div class="sous">${echapper(B.sousTitre)}</div>
      <div class="attention"><b class="accent">${echapper(B.attention)}</b>${echapper(B.attentionTexte)}</div>
    </div>
    <div class="europe">${drapeauEuropeHtml()}<div>${B.financeParLEurope.map(echapper).join('<br>')}</div></div>
  </div>
  <p class="important"><b class="accent">${echapper(B.important)}</b>${echapper(B.importantAvant)}<em class="accent">${echapper(B.importantBordereau)}</em>${echapper(B.importantMilieu)}<b class="accent">${echapper(B.importantForceMajeure)}</b>${echapper(B.importantFin)}</p>
  <div class="cadre">
    <div class="ligne">${echapper(B.nPacage)} ${casesHtml(identite.numeroPacage, CASES_NUMERO_PACAGE, 5.3)}<span class="espace"></span>${echapper(B.nSiret)} ${casesHtml(identite.siret, CASES_NUMERO_SIRET, 5.3)}</div>
    <div class="ligne">${echapper(B.nom)} <span class="pointilles">${echapper(identite.nom)}</span></div>
  </div>
  <div class="cadre">
    <div class="ligne">${echapper(B.declareAvoirPerdu)} ${casesHtml(brebis, CASES_NOMBRE_BORDEREAU, 7, true)} ${echapper(B.brebisEtOu)}${casesHtml(chevres, CASES_NOMBRE_BORDEREAU, 7, true)} ${echapper(B.chevresEffectif)}</div>
    <div class="ligne">${echapper(B.perteIntervenueLe)} ${date(jour, mois)} ${echapper(B.motifSuivant)}</div>
    <div class="ligne motifs">${caseACocher(false)} ${echapper(B.motifs.vente)}<span class="sep"></span>${caseACocher(false)} ${echapper(B.motifs.abattage)}<span class="sep"></span>${caseACocher(false)} ${echapper(B.motifs.accident)}<span class="sep"></span>${caseACocher(true)} ${echapper(B.motifs.mortalite)}<span class="sep"></span>${caseACocher(false)} ${echapper(B.motifs.autre)} <span class="pointilles"></span></div>
    <div class="ligne">${echapper(B.parAilleurs)}<span class="puces"> • ${echapper(B.remplacementBrebis)} ${casesHtml('', CASES_NOMBRE_BORDEREAU, 7)} ${echapper(B.brebisEtOuPar)} ${casesHtml('', CASES_NOMBRE_BORDEREAU, 7)} ${echapper(B.agnelles)}</span></div>
    <div class="ligne decale">• ${echapper(B.remplacementChevres)} ${casesHtml('', CASES_NOMBRE_BORDEREAU, 7)} ${echapper(B.chevresEtOuPar)} ${casesHtml('', CASES_NOMBRE_BORDEREAU, 7)} ${echapper(B.chevrettes)}</div>
    <div class="ligne">${echapper(B.remplacementLe)} ${dateSansRemplissage}</div>
    <div class="ligne">${echapper(B.commentaires)} <span class="pointilles"></span></div>
  </div>
  <div class="cadre signature">
    <div class="ligne">${echapper(B.a)} <span class="pointilles"></span>, ${echapper(B.le)} ${casesHtml('', CASES_JOUR_MOIS, 5)} ${casesHtml('', CASES_JOUR_MOIS, 5)} ${casesHtml(annee, CASES_ANNEE, 4.6)}</div>
    <div class="texte-signature">${echapper(B.signature)}</div>
  </div>
  ${coupe ? '<div class="coupe"><span>✂</span><span>✂</span></div>' : ''}
</div>`;
}

/** Le bordereau est dessiné en millimètres et en points ; la page du PDF a 595 × 842 points, que l'on compte ici en pixels. */
const PX_PAR_MM = 72 / 25.4;
const enPixels = (css: string): string =>
  css
    .replace(/(\d+(?:\.\d+)?)mm/g, (_, n) => `${(Number(n) * PX_PAR_MM).toFixed(2)}px`)
    .replace(/(\d+(?:\.\d+)?)pt/g, (_, n) => `${n}px`);

const STYLES = enPixels(`
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: ${colors.noir}; font-size: 8.8pt; }
  /* Sur l'ordinateur, la page s'agrandit d'un tiers (--k, voir bureau/print.ts) : le formulaire garde ses proportions. */
  .page { width: calc(595px * var(--k, 1)); height: calc(842px * var(--k, 1)); page-break-after: always; overflow: hidden; }
  .echelle { width: 595px; height: 842px; transform-origin: 0 0; transform: scale(var(--k, 1)); }
  .page:last-child { page-break-after: auto; }
  .slot { height: 148.5mm; padding: 5mm 9mm 0 11mm; position: relative; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; height: 35mm; }
  .ministere { width: 50mm; line-height: 1.15; }
  .ministere b { display: block; font-size: 9.4pt; letter-spacing: 0.2mm; }
  .ministere em { display: block; font-family: 'Times New Roman', serif; font-size: 5.8pt; line-height: 1.15; margin-top: 1mm; }
  .marque { display: flex; gap: 1mm; margin-bottom: 1.5mm; }
  .marque i { display: inline-block; width: 4mm; height: 2.6mm; background: #8b8b8b; }
  .centre { flex: 1; text-align: center; padding-top: 0.5mm; }
  .direction { font-weight: 700; font-size: 9.2pt; }
  .camp { font-weight: 700; font-size: 12.5pt; color: ${bleu.titreClair}; line-height: 1.1; }
  .titre { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 22pt; line-height: 1; margin-top: 0.5mm; }
  .sous { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 14.5pt; line-height: 1.15; margin-top: 0.5mm; }
  .attention { font-size: 9.2pt; line-height: 1.2; margin: 1mm auto 0; max-width: 78mm; }
  .accent { color: ${bleu.accent}; font-style: normal; }
  em.accent { font-style: italic; }
  .europe { width: 50mm; text-align: right; font-size: 7.6pt; line-height: 1.2; padding-top: 1mm; }
  .europe > div { display: inline-block; text-align: center; width: 28mm; }
  .drapeau { width: 26mm; height: 17.2mm; display: inline-block; margin: 0 1mm 2.5mm 0; }
  .important { margin: 0 0 2mm; font-size: 9.2pt; line-height: 1.2; text-align: justify; }
  .cadre { border: 0.8mm solid ${bleu.cadre}; background: ${bleu.fondCadre}; padding: 1mm 2.2mm; margin-bottom: -0.8mm; }
  .ligne { display: flex; align-items: flex-end; flex-wrap: nowrap; white-space: nowrap; gap: 1mm; min-height: 5.6mm; padding: 0.3mm 0; }
  .ligne .espace { flex: 1; }
  .ligne.decale { padding-left: 29mm; }
  .puces { display: inline-flex; gap: 1mm; align-items: flex-end; }
  .pointilles { flex: 1; border-bottom: 0.3mm dotted ${bleu.trait}; min-height: 4mm; padding-left: 1mm; font-weight: 700; }
  .cs { display: inline-flex; border-bottom: 0.3mm solid ${bleu.trait}; height: 5.2mm; align-items: flex-end; }
  .cs i { display: inline-block; height: 5.2mm; font-style: normal; font-weight: 700; text-align: center; line-height: 5.2mm; background: linear-gradient(${bleu.trait}, ${bleu.trait}) right bottom / 0.3mm 28% no-repeat; }
  .cs i:first-child { background: linear-gradient(${bleu.trait}, ${bleu.trait}) left bottom / 0.3mm 100% no-repeat, linear-gradient(${bleu.trait}, ${bleu.trait}) right bottom / 0.3mm 28% no-repeat; }
  .cs i:last-child { background: linear-gradient(${bleu.trait}, ${bleu.trait}) right bottom / 0.3mm 100% no-repeat; }
  .bleu { color: ${bleu.accent}; }
  .boite { display: inline-block; width: 4.2mm; height: 4.2mm; border: 0.3mm solid ${bleu.trait}; text-align: center; font-weight: 700; line-height: 3.8mm; font-size: 8pt; }
  .motifs { gap: 1.2mm; }
  .motifs .sep { width: 3.5mm; }
  .signature { margin-top: 0.8mm; padding-bottom: 10mm; }
  .texte-signature { font-size: 8.8pt; line-height: 1.2; margin-top: 1mm; }
  .coupe { position: absolute; left: 0; right: 0; bottom: 2mm; border-top: 0.35mm dotted ${colors.noir}; display: flex; justify-content: space-between; font-size: 9pt; line-height: 1; }
  .coupe span { margin-top: -2.6mm; background: ${colors.surface}; padding: 0 1mm; `);

/** Le document : deux bordereaux de perte par page A4 (comme le formulaire papier), un par jour de perte. */
export function bordereauxPerteHtml(
  pertes: PerteBordereau[],
  identite: IdentiteSuivi,
  colonne: ColonneSuivi,
): string {
  const pages: string[] = [];
  for (let i = 0; i < pertes.length; i += 2) {
    const haut = bordereauHtml(pertes[i], identite, colonne, true);
    const bas = pertes[i + 1] ? bordereauHtml(pertes[i + 1], identite, colonne, false) : '';
    pages.push(`<section class="page"><div class="echelle">${haut}${bas}</div></section>`);
  }
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`;
}

/** Les pertes des années demandées, jour par jour (les bordereaux à remplir). */
export async function pertesDesAnnees(annees: number[]): Promise<PerteBordereau[]> {
  const animaux = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
  return annees.flatMap((annee) => pertesDeLAnnee(animaux, annee));
}

/**
 * Crée le PDF des bordereaux de perte (un par jour où des animaux sont morts) et le partage ; rend le nombre de
 * bordereaux (zéro : rien n'est créé, il n'y a aucune perte à déclarer).
 */
export async function exporterBordereauxPertePdf(annees: number[]): Promise<number> {
  const pertes = await pertesDesAnnees(annees);
  if (pertes.length === 0) return 0;
  const settings = await getSettings();
  const html = bordereauxPerteHtml(
    pertes,
    identiteDuSuivi(settings.exploitation),
    colonneDeLEspece(especeCourante()),
  );
  const periode = annees.length === 1 ? `${annees[0]}` : `${annees[0]}-${annees[annees.length - 1]}`;
  await ecrireEtPartagerPdf(
    html,
    `${NOM_FICHIER_EXPORT_BORDEREAUX_PERTE}_${periode}.${FORMAT_EXPORT.PDF}`,
    B.titre,
    { sansMarges: true },
  );
  return pertes.length;
}
