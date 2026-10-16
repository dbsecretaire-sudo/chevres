import { codePostalEtCommune, effectifALaMontee } from '@/features/cheptel/services/estive';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { drapeauEuropeHtml } from '@/features/export/bordereauPertePdf';
import { MODELE_ESTIVE_2026 } from '@/features/export/modeles/estive2026';
import { echapper, ecrireEtPartagerPdf, ecrirePdfBase64EtPartager } from '@/features/export/services/htmlPdf';
import { remplirModele } from '@/features/export/services/modelePdf';
import { identiteDuSuivi, type IdentiteSuivi } from '@/features/export/suiviMouvementsPdf';
import { getSettings, type ReglagesEstive } from '@/features/settings/settings';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_DECLARATION_ESTIVE } from '@/shared/constants/export';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { couleursFormulaireEstive as teinte } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

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

/**
 * Le nom et le prénom d'un nom complet écrit « Nom Prénom » (l'ordre de l'application) : le premier mot est le nom, le reste le prénom.
 * Un seul mot (une raison sociale d'un mot, ou un nom seul) reste entièrement dans le nom.
 */
export function separerNomPrenom(complet: string): { nom: string; prenom: string } {
  const mots = complet.trim().split(/\s+/).filter(Boolean);
  return mots.length >= 2 ? { nom: mots[0], prenom: mots.slice(1).join(' ') } : { nom: complet.trim(), prenom: '' };
}

/** Le cadre « Identification de l'entité collective » : ce que l'utilisateur en a saisi, complété par ses propres numéros quand il est lui-même le gestionnaire. */
export interface EntiteCollective {
  numeroPacage: string;
  siret: string;
  commune: string;
  gestionnaire: string;
}

/** Vrai quand le gestionnaire de l'estive est l'exploitant : coché par l'utilisateur, ou même nom (dans un sens ou dans l'autre). */
export function estLeGestionnaire(d: Pick<DonneesEstive, 'moiGestionnaire' | 'gestionnaire' | 'identite'>): boolean {
  if (d.moiGestionnaire !== undefined) return d.moiGestionnaire;
  const mots = (texte: string) => texte.toLowerCase().split(/\s+/).filter(Boolean).sort().join(' ');
  return !!d.gestionnaire?.trim() && mots(d.gestionnaire) === mots(d.identite.nom);
}

export function entiteCollective(d: DonneesEstive): EntiteCollective {
  const moi = estLeGestionnaire(d);
  return {
    numeroPacage: moi ? d.identite.numeroPacage : '',
    siret: moi ? d.identite.siret : '',
    commune: d.communeGestionnaire?.trim() || (moi ? d.commune : ''),
    gestionnaire: d.gestionnaire?.trim() || (moi ? d.identite.nom : ''),
  };
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
  const { nom, prenom } = separerNomPrenom(d.identite.nom);
  return `<tr class="remplie"><td>${casesHtml(d.identite.numeroPacage, 9)}</td><td class="texte">${echapper(nom)}</td><td class="texte">${echapper(prenom)}</td><td>${casesHtml(chiffresCheptel(d.identite.numeroExploitation), 8, 'FR')}</td><td>${casesHtml(d.codePostal, 5)}</td><td class="texte">${echapper(d.commune)}</td>${vide(4)}<td class="nombre">${d.effectifCaprins === undefined ? '' : d.effectifCaprins}</td>${vide(2)}<td>${dateEnCases(d.dateMontee)}</td><td>${dateEnCases(d.dateDescente)}</td><td class="texte">${echapper(observations)}</td></tr>`;
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
  const entite = entiteCollective(d);
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
        <div class="ligne">${echapper(E.nPacage)} ${casesHtml(entite.numeroPacage, 9)}<span style="flex:1"></span>${echapper(E.nSiret)} ${casesHtml(entite.siret, 14)}</div>
        <div class="ligne">${echapper(E.communeSiege)} <span class="pointilles">${echapper(entite.commune)}</span></div>
        <div class="ligne">${echapper(E.nomGestionnaire)} <span class="pointilles">${echapper(entite.gestionnaire)}</span></div>
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

/** Les coordonnées (en points PDF, depuis le bas de la feuille) du formulaire officiel de la campagne 2026, relevées sur le PDF de la DDT(M). */
const OFFICIEL = {
  /** La ligne de base de la première ligne du tableau (les lignes suivantes, tous les 21,54 points, restent vides). */
  baseLigne: 583,
  /** Les chiffres des cases se relèvent un peu : ils ne touchent pas le trait du bas. */
  releveCases: 1.3,
  pacage: { x: 31.3, pas: 82.1 / 9 },
  nom: { x: 122.7, largeur: 147 },
  prenom: { x: 278.6, largeur: 88 },
  cheptel: { x: 390.3, pas: 125.2 / 14 },
  codePostal: { x: 390.3 + 9 * (125.2 / 14), pas: 125.2 / 14 },
  commune: { x: 522.8, largeur: 106 },
  caprins: { centre: (754.1 + 790.9) / 2 },
  montee: { x: 902.5, pas: 9.375 },
  descente: { x: 948, pas: 9.375 },
  observations: { x: 1038.7, largeur: 120 },
  entite: {
    pacage: { x: 650.2, y: 775, pas: 119.2 / 9 },
    siret: { x: 820.6, y: 775, pas: 185.2 / 14 },
    commune: { x: 760, y: 751.5, largeur: 246 },
    gestionnaire: { x: 764, y: 727.5, largeur: 242 },
  },
} as const;

/** « JJMM » d'une date AAAA-MM-JJ, pour les quatre cases de la date ; vide sans date. */
const jourMois = (iso: string | undefined): string => (iso ? iso.slice(8, 10) + iso.slice(5, 7) : '');

/**
 * Remplit le formulaire officiel de la campagne 2026 (la feuille de la DDT(M), embarquée dans l'application) : le PDF garde son aspect
 * exact, seules les valeurs s'y ajoutent — la ligne de l'exploitation, le cadre de l'entité collective. Rend le PDF en base64.
 */
export function remplirDeclarationEstive(d: DonneesEstive): Promise<string> {
  const entite = entiteCollective(d);
  const { nom, prenom } = separerNomPrenom(d.identite.nom);
  const y = OFFICIEL.baseLigne;
  const yCases = y + OFFICIEL.releveCases;
  const cheptel = d.identite.numeroExploitation.replace(/^FR/, '');
  return remplirModele(MODELE_ESTIVE_2026, 1, ({ centre, ajuste, cases }) => {
    // L'entité collective.
    cases(OFFICIEL.entite.pacage.x, OFFICIEL.entite.pacage.y, OFFICIEL.entite.pacage.pas, entite.numeroPacage, 10);
    cases(OFFICIEL.entite.siret.x, OFFICIEL.entite.siret.y, OFFICIEL.entite.siret.pas, entite.siret, 10);
    ajuste(OFFICIEL.entite.commune.x, OFFICIEL.entite.commune.y, entite.commune, OFFICIEL.entite.commune.largeur, 9.5);
    ajuste(
      OFFICIEL.entite.gestionnaire.x,
      OFFICIEL.entite.gestionnaire.y,
      entite.gestionnaire,
      OFFICIEL.entite.gestionnaire.largeur,
      9.5,
    );
    // La ligne de l'exploitation.
    cases(OFFICIEL.pacage.x, yCases, OFFICIEL.pacage.pas, d.identite.numeroPacage, 10);
    ajuste(OFFICIEL.nom.x, y, nom, OFFICIEL.nom.largeur, 9.5);
    ajuste(OFFICIEL.prenom.x, y, prenom, OFFICIEL.prenom.largeur, 9.5);
    cases(OFFICIEL.cheptel.x, yCases, OFFICIEL.cheptel.pas, cheptel, 10);
    cases(OFFICIEL.codePostal.x, yCases, OFFICIEL.codePostal.pas, d.codePostal, 10);
    ajuste(OFFICIEL.commune.x, y, d.commune, OFFICIEL.commune.largeur, 9.5);
    if (d.effectifCaprins !== undefined) centre(OFFICIEL.caprins.centre, y, String(d.effectifCaprins), 11, true);
    cases(OFFICIEL.montee.x, yCases, OFFICIEL.montee.pas, jourMois(d.dateMontee), 10);
    cases(OFFICIEL.descente.x, yCases, OFFICIEL.descente.pas, jourMois(d.dateDescente), 10);
    if (d.zone) ajuste(OFFICIEL.observations.x, y, d.zone, OFFICIEL.observations.largeur, 9);
  });
}

/** Les campagnes dont le formulaire officiel est embarqué : les autres sont dessinées d'après le même modèle. */
export const CAMPAGNES_OFFICIELLES: readonly number[] = [2026];

/** Les données de la déclaration d'une année : l'exploitation, l'effectif de caprins au jour de la montée et ce que l'utilisateur a saisi. */
export async function donneesDeLaDeclaration(annee: number, estive: ReglagesEstive): Promise<DonneesEstive> {
  const [tous, ventes, settings] = await Promise.all([
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL),
    listToutesVentes(),
    getSettings(),
  ]);
  const infos = settings.exploitation;
  // Sans date de montée, l'effectif est celui d'aujourd'hui (le cheptel du moment).
  const jourDeLEffectif = estive.dateMontee || todayISO();
  const effectifCaprins = effectifALaMontee(deEspeceCourante(tous), ventes, jourDeLEffectif, {
    abattoir: T.abattoir,
    autoConsommation: T.autoConsommation,
  });
  return {
    ...estive,
    annee,
    identite: identiteDuSuivi(infos),
    ...codePostalEtCommune(infos?.adresseExploitant),
    effectifCaprins,
  };
}

/**
 * Crée la déclaration de montée et descente d'estive d'une année et la partage. Pour la campagne 2026, c'est le formulaire officiel de la
 * DDT(M), rempli ; pour une autre campagne, une page dessinée d'après le même modèle.
 */
export async function exporterDeclarationEstivePdf(annee: number, estive: ReglagesEstive): Promise<void> {
  const donnees = await donneesDeLaDeclaration(annee, estive);
  const nomFichier = `${NOM_FICHIER_EXPORT_DECLARATION_ESTIVE}_${annee}.${FORMAT_EXPORT.PDF}`;
  if (CAMPAGNES_OFFICIELLES.includes(annee)) {
    await ecrirePdfBase64EtPartager(await remplirDeclarationEstive(donnees), nomFichier, E.titre);
    return;
  }
  await ecrireEtPartagerPdf(declarationEstiveHtml(donnees), nomFichier, E.titre, { paysage: true, sansMarges: true });
}
