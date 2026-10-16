import { codePostalEtCommune } from '@/features/cheptel/services/estive';
import { recensementAnnuel, type Recensement } from '@/features/cheptel/services/recensement';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { colonneDeLEspece, identiteDuSuivi, type IdentiteSuivi } from '@/features/export/suiviMouvementsPdf';
import { getSettings } from '@/features/settings/settings';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { COLONNE_SUIVI_PAR_ESPECE, type ColonneSuivi } from '@/shared/constants/suiviMouvements';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { loadAllYears } from '@/shared/storage/localStore';
import { TEXTES } from '@/shared/textes';

const R = TEXTES.cheptel.suiviMouvements.recensement;

/** Ce que le formulaire reprend de l'exploitation. */
export interface DonneesRecensement {
  recensement: Recensement;
  identite: IdentiteSuivi;
  /** La première ligne de l'adresse de l'exploitation (le lieu-dit) ; à défaut, la commune. */
  ligneAdresse: string;
  codePostal: string;
  commune: string;
  colonne: ColonneSuivi;
  /** Vrai : le type de production « lait » est coché ; faux : « viande ». */
  lait: boolean;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0 6mm; font-size: 10pt; }
  .chambre { color: #3b8a3d; font-weight: 700; font-size: 12pt; line-height: 1.15; }
  .adresse { border: 1.5px solid #111; width: 60%; margin: 4mm 0 0 auto; padding: 3mm 4mm; text-align: center; font-weight: 700; font-size: 12pt; line-height: 1.6; text-transform: uppercase; }
  h1 { font-size: 16pt; text-decoration: underline; margin: 7mm 0 4mm; text-align: center; }
  .mention { background: #ffff1a; text-align: justify; font-weight: 600; padding: 1mm 0; line-height: 1.35; }
  .production { text-align: center; margin: 5mm 0 4mm; font-weight: 600; }
  .production span { margin: 0 10mm; }
  .case { display: inline-block; width: 12mm; height: 7mm; border: 1.5px solid #111; vertical-align: middle; text-align: center; font-weight: 800; line-height: 6mm; margin-left: 3mm; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1.5px solid #111; padding: 1.5mm 3mm; vertical-align: middle; }
  th { text-align: center; font-weight: 700; }
  th.cheptel { text-align: left; }
  td.libelle { font-weight: 600; text-align: justify; line-height: 1.3; }
  td.valeur { text-align: center; font-size: 13pt; font-weight: 700; color: #1a2a8a; }
  .bas { margin-top: 5mm; font-weight: 600; line-height: 1.4; }
  .signature { display: flex; justify-content: space-between; margin-top: 5mm; font-weight: 700; }
  .conserver { background: #e01b1b; color: #fff; text-align: center; font-weight: 700; margin: 8mm auto 0; padding: 0.5mm 4mm; width: fit-content; }
  .pied { text-align: center; color: #3b8a3d; margin-top: 5mm; line-height: 1.4; }
`;

/** Le recensement annuel des ovins et caprins : le formulaire de la Chambre d'agriculture, avec les effectifs calculés d'après le cheptel. */
export function recensementHtml(d: DonneesRecensement): string {
  const { recensement: r, identite: i } = d;
  const caprins = d.colonne === COLONNE_SUIVI_PAR_ESPECE.chevres;
  const effectif = [
    r.femelles > 0 ? R.femelles(r.femelles) : '',
    r.males > 0 ? R.males(r.males, caprins) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const cellule = (valeurCaprins: string, colonneCaprins: boolean) =>
    `<td class="valeur">${colonneCaprins === caprins ? echapper(valeurCaprins) : ''}</td>`;
  const ligne = (libelle: string, valeur: string) =>
    `<tr><td class="libelle">${echapper(libelle)}</td>${cellule(valeur, false)}${cellule(valeur, true)}</tr>`;
  const nomEnMajuscules = i.nom ? `${R.monsieur} ${i.nom}`.toUpperCase() : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
  <div class="chambre">${echapper(R.chambre[0])}<br>${echapper(R.chambre[1])}</div>
  <div class="adresse">${echapper(nomEnMajuscules)}<br>${echapper(d.ligneAdresse || d.commune)}<br>${echapper(`${d.codePostal} ${d.commune}`.trim())}</div>
  <h1>${echapper(R.titre(r.annee))}</h1>
  <p class="mention">${echapper(R.mention(r.annee))}</p>
  <div class="production">${echapper(R.typeDeProduction)}<br>
    <span>${echapper(R.lait)} <i class="case">${d.lait ? '✕' : ''}</i></span>
    <span>${echapper(R.viande)} <i class="case">${d.lait ? '' : '✕'}</i></span>
  </div>
  <table>
    <colgroup><col style="width:42%" /><col style="width:29%" /><col style="width:29%" /></colgroup>
    <thead><tr><th class="cheptel">${echapper(R.cheptel)} FR ${echapper(i.numeroExploitation)}</th><th>${echapper(R.effectifsOvins)}</th><th>${echapper(R.effectifsCaprins)}</th></tr></thead>
    <tbody>
      ${ligne(R.ligne1(r.annee), effectif)}
      ${ligne(R.ligne2(r.annee - 1), String(r.nes))}
      ${ligne(R.ligne3(r.annee - 1), '')}
    </tbody>
  </table>
  <p class="bas">${echapper(R.cessation)}</p>
  <div class="signature"><span>${echapper(R.date)} ………………………</span><span>${echapper(R.signature)}</span></div>
  <div class="conserver">${echapper(R.conserver)}</div>
  <div class="pied">${echapper(R.chambreAdresse[0])}<br>${echapper(R.chambreAdresse[1])}<br>${echapper(R.chambreAdresse[2])}</div>
</body>
</html>`;
}

/**
 * Crée le recensement annuel (PDF) d'après le cheptel de l'espèce courante, et l'ouvre à l'envoi ou à l'impression. On donne l'année des
 * données : pour 2026, c'est le recensement 2027 (les effectifs au 1er janvier 2027 et les naissances du 1er janvier au 31 décembre 2026).
 */
export async function exporterRecensementPdf(anneeDesDonnees: number): Promise<void> {
  const annee = anneeDesDonnees + 1;
  const [tous, settings] = await Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL), getSettings()]);
  const infos = settings.exploitation;
  const espece = especeCourante();
  const colonne = colonneDeLEspece(espece);
  const html = recensementHtml({
    recensement: recensementAnnuel(deEspeceCourante(tous), annee),
    identite: identiteDuSuivi(infos),
    ligneAdresse:
      (infos?.adresseExploitant ?? '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l && !/^\d{5}\s/.test(l)) ?? '',
    ...codePostalEtCommune(infos?.adresseExploitant),
    colonne,
    lait: true,
  });
  await ecrireEtPartagerPdf(html, `${R.fichier}_${annee}.${FORMAT_EXPORT.PDF}`, R.titre(annee));
}
