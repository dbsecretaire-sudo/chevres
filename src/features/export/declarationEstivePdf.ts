import { codePostalEtCommune, effectifALaMontee } from '@/features/cheptel/services/estive';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { drapeauEuropeHtml } from '@/features/export/bordereauPertePdf';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { identiteDuSuivi, type IdentiteSuivi } from '@/features/export/suiviMouvementsPdf';
import { getSettings, type ReglagesEstive } from '@/features/settings/settings';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_DECLARATION_ESTIVE } from '@/shared/constants/export';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { couleursFormulaireEstive as teinte } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.suiviMouvements;
const E = T.estive;

/** Le nombre de lignes du tableau des utilisateurs, comme le formulaire papier. */
const LIGNES = 23;

/** Ce que la déclaration reprend de l'exploitation et de la transhumance. */
export interface DonneesEstive extends ReglagesEstive {
  annee: number;
  identite: IdentiteSuivi;
  codePostal: string;
  commune: string;
  /** Les caprins de plus d'un an ou chèvres ayant mis bas au jour de la montée ; absent : la case reste vide. */
  effectifCaprins?: number;
}

/** Un numéro dans ses cases (une par caractère) ; « FR » est imprimé devant le numéro de cheptel. */
const casesHtml = (valeur: string, nombre: number, prefixe = ''): string =>
  `<span class="cases">${[...prefixe].map((c) => `<i class="pre">${echapper(c)}</i>`).join('')}${Array.from({ length: nombre }, (_, k) => `<i>${echapper(valeur[k] ?? '')}</i>`).join('')}</span>`;

/** Une date « JJ/MM » dans deux paires de cases ; vide sans date. */
function dateEnCases(iso: string | undefined): string {
  const jour = iso ? iso.slice(8, 10) : '';
  const mois = iso ? iso.slice(5, 7) : '';
  return `<span class="cases">${[jour[0], jour[1]].map((c) => `<i>${echapper(c ?? '')}</i>`).join('')}</span><span class="barre">/</span><span class="cases">${[mois[0], mois[1]].map((c) => `<i>${echapper(c ?? '')}</i>`).join('')}</span>`;
}

const multiligne = (lignes: readonly string[]): string => lignes.map(echapper).join('<br>');

/** Les chiffres du numéro de cheptel, sans le « FR » imprimé. */
const chiffresCheptel = (numero: string): string => (numero.startsWith('FR') ? numero.slice(2) : numero);

/** Une ligne du tableau : celle de l'exploitation (remplie) ou une ligne vide pour les autres utilisateurs. */
function ligneHtml(d: DonneesEstive | undefined): string {
  const vide = (n: number) => '<td></td>'.repeat(n);
  if (!d) {
    return `<tr><td>${casesHtml('', 9)}</td><td></td><td></td><td>${casesHtml('', 8, 'FR')}</td><td>${casesHtml('', 5)}</td><td></td>${vide(7)}<td>${dateEnCases(undefined)}</td><td>${dateEnCases(undefined)}</td><td></td></tr>`;
  }
  const observations = [d.zone].filter(Boolean).join(' · ');
  return `<tr class="remplie"><td>${casesHtml(d.identite.numeroPacage, 9)}</td><td class="texte">${echapper(d.identite.nom)}</td><td></td><td>${casesHtml(chiffresCheptel(d.identite.numeroExploitation), 8, 'FR')}</td><td>${casesHtml(d.codePostal, 5)}</td><td class="texte">${echapper(d.commune)}</td>${vide(4)}<td class="nombre">${d.effectifCaprins === undefined ? '' : d.effectifCaprins}</td>${vide(2)}<td>${dateEnCases(d.dateMontee)}</td><td>${dateEnCases(d.dateDescente)}</td><td class="texte">${echapper(observations)}</td></tr>`;
}

/** La date limite de renvoi imprimée sur le formulaire de la campagne 2026 ; les autres campagnes renvoient à la DDT(M). */
const dateLimite = (annee: number): string =>
  annee === 2026 ? E.auPlusTard(`au plus tard le 16 novembre ${annee}`) : E.auPlusTard(E.auPlusTardSansDate);

const STYLES = `
  * { box-sizing: border-box; }
  @page { size: A4 landscape; margin: 0; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: ${teinte.texte}; font-size: 6.4pt; }
  /* Une feuille A4 en paysage entière, sans marge d'impression (comme le carnet sanitaire). */
  .page { width: 297mm; height: 210mm; padding: 6mm 7mm 5mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .haut { display: flex; justify-content: space-between; align-items: flex-start; height: 29mm; }
  .ministere { width: 58mm; line-height: 1.12; font-size: 6.6pt; }
  .ministere b { display: block; font-size: 7.8pt; letter-spacing: 0.15mm; }
  .ministere em { display: block; font-family: 'Times New Roman', serif; font-size: 4.6pt; line-height: 1.1; margin-top: 0.8mm; }
  .marque { display: flex; gap: 1mm; margin-bottom: 1.2mm; }
  .marque i { display: inline-block; width: 3.4mm; height: 2.2mm; background: #8b8b8b; }
  .centre { width: 112mm; text-align: center; line-height: 1.15; }
  .direction { font-weight: 700; font-size: 6.8pt; }
  .campagne { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 13pt; color: ${teinte.accent}; margin-top: 1.5mm; }
  .campagne small { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; }
  .titre { font-family: 'Times New Roman', Times, serif; font-weight: 700; font-size: 15pt; line-height: 1.05; }
  .consigne { color: ${teinte.accent}; font-weight: 700; font-size: 7.2pt; line-height: 1.25; margin-top: 1.5mm; }
  .entite { width: 108mm; }
  .entite h4 { margin: 0 0 0.6mm; font-family: 'Times New Roman', serif; font-size: 7.4pt; color: ${teinte.accent}; }
  .entite .cadre { border: 0.7mm solid ${teinte.entete}; background: ${teinte.cadre}; padding: 1.4mm 2mm; line-height: 1.6; font-size: 6.4pt; }
  .entite .ligne { display: flex; align-items: flex-end; gap: 1.5mm; white-space: nowrap; }
  .entite .pointilles { flex: 1; border-bottom: 0.25mm dotted ${teinte.trait}; min-height: 3.6mm; padding-left: 1mm; font-weight: 700; overflow: hidden; }
  .europe { width: 26mm; text-align: center; font-size: 5.4pt; line-height: 1.15; }
  .drapeau { width: 18mm; height: 12mm; display: block; margin: 0 0 1.2mm auto; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 0.4mm solid ${teinte.trait}; }
  th, td { border: 0.2mm solid ${teinte.trait}; padding: 0 0.6mm; text-align: center; vertical-align: middle; overflow: hidden; }
  th { background: ${teinte.entete}; font-weight: 700; font-size: 5.6pt; line-height: 1.12; }
  th.bandeau { background: ${teinte.bandeau}; color: #fff; font-family: 'Times New Roman', serif; font-size: 7pt; height: 5.2mm; }
  th.groupe { height: 5.2mm; font-family: 'Times New Roman', serif; font-size: 6.6pt; }
  th.petit { font-weight: 400; font-size: 5pt; }
  th.obs { font-weight: 400; font-style: italic; font-size: 5.4pt; }
  tbody td { height: 5.3mm; font-size: 7.4pt; }
  tbody td.texte { font-weight: 700; text-align: left; font-size: 6.4pt; white-space: nowrap; }
  tbody td.nombre { font-weight: 700; font-size: 8.4pt; }
  .cases { display: inline-flex; align-items: flex-end; height: 4mm; }
  .cases i { display: inline-block; width: 1.85mm; height: 4mm; font-style: normal; font-weight: 700; font-size: 6.6pt; text-align: center; line-height: 4mm; border-bottom: 0.2mm solid ${teinte.trait}; border-left: 0.2mm solid ${teinte.trait}; }
  .cases i:last-child { border-right: 0.2mm solid ${teinte.trait}; }
  .cases i.pre { border: none; width: 3mm; font-size: 7.2pt; }
  .barre { margin: 0 0.3mm; font-size: 7pt; }
  .bas { display: flex; gap: 4mm; margin-top: 1.6mm; font-size: 5.6pt; line-height: 1.25; }
  .bas .notes { flex: 1; }
  .signature { width: 70mm; border: 0.7mm solid ${teinte.entete}; background: ${teinte.cadre}; padding: 1.4mm 2mm; font-size: 6.2pt; line-height: 1.5; }
  .signature .ligne { display: flex; align-items: flex-end; gap: 1.5mm; }
  .signature .pointilles { flex: 1; border-bottom: 0.25mm dotted ${teinte.trait}; min-height: 3.4mm; }
`;

/** La déclaration de montée et descente d'estive : une page A4 en paysage, avec la ligne de l'exploitation remplie. */
export function declarationEstiveHtml(d: DonneesEstive): string {
  const ligneVide = ligneHtml(undefined);
  const lignes = [ligneHtml(d), ...Array.from({ length: LIGNES - 1 }, () => ligneVide)].join('');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
<section class="page">
  <div class="haut">
    <div class="ministere">
      <div class="marque"><i></i><i></i></div>
      <b>${multiligne(T.bordereauPerte.ministere)}</b>
      <em>${multiligne(T.bordereauPerte.devise)}</em>
    </div>
    <div class="centre">
      <div class="direction">${multiligne(E.direction)}</div>
      <div class="campagne">${echapper(E.dossierPac)} · <small>${echapper(E.campagne(d.annee))}</small></div>
      <div class="titre">${echapper(E.titreFormulaire)}</div>
      <div class="consigne">${echapper(E.aCompleter)}<br>${echapper(E.aRenvoyer)}<br>${echapper(dateLimite(d.annee))}</div>
    </div>
    <div class="entite">
      <h4>${echapper(E.entiteCollective)}</h4>
      <div class="cadre">
        <div class="ligne">${echapper(E.nPacage)} ${casesHtml('', 9)}<span style="flex:1"></span>${echapper(E.nSiret)} ${casesHtml('', 14)}</div>
        <div class="ligne">${echapper(E.communeSiege)} <span class="pointilles">${echapper(d.communeGestionnaire ?? '')}</span></div>
        <div class="ligne">${echapper(E.nomGestionnaire)} <span class="pointilles">${echapper(d.gestionnaire ?? '')}</span></div>
      </div>
    </div>
    <div class="europe">${drapeauEuropeHtml()}<div>${multiligne(T.bordereauPerte.financeParLEurope)}</div></div>
  </div>
  <table>
    <colgroup>
      <col style="width:8.6%" /><col style="width:12.6%" /><col style="width:7.6%" /><col style="width:10.6%" /><col style="width:5.6%" /><col style="width:8%" />
      <col style="width:3.2%" /><col style="width:3.2%" /><col style="width:3.2%" /><col style="width:3.9%" /><col style="width:3.9%" /><col style="width:3.5%" />
      <col style="width:7%" /><col style="width:4.5%" /><col style="width:4.5%" /><col style="width:10.4%" />
    </colgroup>
    <thead>
      <tr>
        <th class="bandeau" colspan="6">${echapper(E.identificationUtilisateurs)}</th>
        <th class="groupe" colspan="3">${echapper(E.bovins)}</th>
        <th class="groupe">${echapper(E.ovins)}</th>
        <th class="groupe">${echapper(E.caprins)}</th>
        <th class="groupe">${echapper(E.equins)}</th>
        <th class="groupe">${echapper(E.autres)}</th>
        <th class="groupe" colspan="2">${echapper(E.dates)}</th>
        <th class="groupe">${echapper(E.observations)}</th>
      </tr>
      <tr>
        <th rowspan="2" style="height:20mm">${multiligne(E.nPacageUtilisateur)}</th>
        <th rowspan="2">${echapper(E.nomRaisonSociale)}</th>
        <th rowspan="2">${echapper(E.prenom)}</th>
        <th rowspan="2">${echapper(E.numeroCheptel)}</th>
        <th colspan="2">${echapper(E.siegeExploitation)}</th>
        <th rowspan="2" class="petit">${multiligne(E.bovinsMoins6)}</th>
        <th rowspan="2" class="petit">${multiligne(E.bovins6a2)}</th>
        <th rowspan="2" class="petit">${multiligne(E.bovinsPlus2)}</th>
        <th rowspan="2" class="petit">${multiligne(E.ovinsColonne)}</th>
        <th rowspan="2" class="petit">${multiligne(E.caprinsColonne)}</th>
        <th rowspan="2" class="petit">${multiligne(E.equidesColonne)}</th>
        <th rowspan="2">${echapper(E.precisez)}</th>
        <th rowspan="2" class="petit">${multiligne(E.montee)}</th>
        <th rowspan="2" class="petit">${multiligne(E.descente)}</th>
        <th rowspan="2" class="obs">${multiligne(E.observationsAide)}</th>
      </tr>
      <tr><th>${echapper(E.codePostal)}</th><th>${echapper(E.commune)}</th></tr>
    </thead>
    <tbody>${lignes}</tbody>
  </table>
  <div class="bas">
    <div class="notes">${multiligne(E.notesBasGauche)}</div>
    <div class="notes">${multiligne(E.notesBasMilieu)}<br><br>${echapper(E.noteDates)}</div>
    <div class="signature">
      <div class="ligne">${echapper(E.signatureA)} <span class="pointilles"></span>${echapper(E.signatureLe)} ${casesHtml('', 2)}<span class="barre">/</span>${casesHtml('', 2)}<span class="barre">/</span>${echapper(String(d.annee))}</div>
      <div>${echapper(E.signatureTexte)}</div>
    </div>
  </div>
</section>
</body>
</html>`;
}

/**
 * Crée la déclaration de montée et descente d'estive d'une année et la partage : l'exploitation (numéros, adresse), l'effectif de caprins
 * au jour de la montée d'après le cheptel, et ce que l'utilisateur a saisi de la transhumance.
 */
export async function exporterDeclarationEstivePdf(annee: number, estive: ReglagesEstive): Promise<void> {
  const [tous, ventes, settings] = await Promise.all([
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL),
    listToutesVentes(),
    getSettings(),
  ]);
  const infos = settings.exploitation;
  const effectifCaprins = estive.dateMontee
    ? effectifALaMontee(deEspeceCourante(tous), ventes, estive.dateMontee, {
        abattoir: T.abattoir,
        autoConsommation: T.autoConsommation,
      })
    : undefined;
  const html = declarationEstiveHtml({
    ...estive,
    annee,
    identite: identiteDuSuivi(infos),
    ...codePostalEtCommune(infos?.adresseExploitant),
    effectifCaprins,
  });
  await ecrireEtPartagerPdf(
    html,
    `${NOM_FICHIER_EXPORT_DECLARATION_ESTIVE}_${annee}.${FORMAT_EXPORT.PDF}`,
    E.titre,
    { paysage: true, sansMarges: true },
  );
}
