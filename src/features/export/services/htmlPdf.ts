import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { identificationCheptel, type InfosExploitation } from '@/features/settings/settings';
import { especesActives, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { MIME_PDF, UTI_PDF } from '@/shared/constants/export';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export function echapper(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function tableauHtml(rows: Record<string, unknown>[], messageVide: string): string {
  if (rows.length === 0) return `<p class="vide">${echapper(messageVide)}</p>`;
  const colonnes = Object.keys(rows[0]);
  const entetes = colonnes.map((c) => `<th>${echapper(c)}</th>`).join('');
  const lignes = rows
    .map((r) => `<tr>${colonnes.map((c) => `<td>${echapper(r[c])}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${entetes}</tr></thead><tbody>${lignes}</tbody></table>`;
}

/**
 * En-tête de l'exploitation : coordonnées communes, puis l'identification du cheptel. Pour un rapport sur une seule
 * espèce, son n° de cheptel et son indicatif suivent les coordonnées ; pour plusieurs espèces, une ligne par espèce.
 */
function enTeteExploitationHtml(infos: InfosExploitation | undefined, especes: EspeceAnimale[]): string {
  if (!infos) return '';
  const identite = [infos.nomExploitant, infos.adresseExploitant].filter(Boolean).map(echapper);
  const unique = especes.length === 1 ? identificationCheptel(infos, especes[0]) : undefined;
  const champs: [string, string | undefined][] = [
    [TEXTES.export.pdfExport.nExploitation, infos.numeroExploitation],
    [TEXTES.commun.general.siret, infos.siret],
    [TEXTES.commun.general.nCheptel, unique?.numeroCheptel],
    [TEXTES.commun.general.indicatifDeMarquage, unique?.indicatifMarquage],
    [TEXTES.export.pdfExport.nPacage, infos.numeroPacage],
    [TEXTES.export.pdfExport.nDetenteur, infos.numeroDetenteur],
  ];
  const champsRenseignes = champs.filter(([, v]) => !!v);
  const parEspece =
    especes.length > 1
      ? especes
          .map((espece) => ({ espece, id: identificationCheptel(infos, espece) }))
          .filter(({ id }) => !!id.numeroCheptel || !!id.indicatifMarquage)
      : [];
  if (identite.length === 0 && champsRenseignes.length === 0 && parEspece.length === 0) return '';

  const ligneIdentite = identite.length > 0 ? `<div>${identite.join(' — ')}</div>` : '';
  const ligneChamps =
    champsRenseignes.length > 0
      ? `<div class="exploitation-grid">${champsRenseignes
          .map(([label, v]) => `<span><strong>${label} :</strong> ${echapper(v)}</span>`)
          .join('')}</div>`
      : '';
  const lignesEspeces = parEspece
    .map(({ espece, id }) => {
      const details = [
        id.numeroCheptel ? `${TEXTES.commun.general.nCheptel} : ${echapper(id.numeroCheptel)}` : '',
        id.indicatifMarquage
          ? `${TEXTES.commun.general.indicatifDeMarquage} : ${echapper(id.indicatifMarquage)}`
          : '',
      ].filter(Boolean);
      return `<div><strong>${echapper(LABEL_ACTIVITE_COMPTABLE[espece])}</strong> — ${details.join(' · ')}</div>`;
    })
    .join('');
  return `<div class="exploitation">${ligneIdentite}${ligneChamps}${lignesEspeces}</div>`;
}

/** Document HTML complet : feuille de style, titre, en-tête de l'exploitation puis le corps. */
export function documentHtml(
  titre: string,
  infos: InfosExploitation | undefined,
  corps: string,
  /** Espèces couvertes par le rapport (celles de l'établissement par défaut) : leur identification figure en en-tête. */
  especes: EspeceAnimale[] = especesActives(),
  /** En-tête déjà construit (celui d'une entreprise) : il remplace celui de l'exploitation. */
  enTete?: string,
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: ${colors.text}; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: ${colors.primaryDark}; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 2px solid ${colors.primary}; padding-bottom: 4px; color: ${colors.primaryDark}; }
  .exploitation { font-size: 11px; color: ${colors.textMuted}; margin: 8px 0 16px; line-height: 1.5; border-bottom: 1px solid ${colors.border}; padding-bottom: 10px; }
  .exploitation-grid { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid ${colors.border}; padding: 5px 7px; font-size: 10px; text-align: left; }
  th { background: ${colors.badgeBg}; font-weight: 700; }
  .vide { font-size: 11px; color: ${colors.textMuted}; font-style: italic; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
  <h1>${echapper(titre)}</h1>
  ${enTete ?? enTeteExploitationHtml(infos, especes)}
  ${corps}
</body>
</html>`;
}

/** Génère le PDF depuis le HTML, le copie sous `nomFichier` et ouvre le menu de partage. */
export async function ecrireEtPartagerPdf(html: string, nomFichier: string, titre: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const destination = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.copyAsync({ from: uri, to: destination });

  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(destination, {
      mimeType: MIME_PDF,
      dialogTitle: titre,
      UTI: UTI_PDF,
    });
  }
}
