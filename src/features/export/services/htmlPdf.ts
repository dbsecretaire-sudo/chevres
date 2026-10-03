import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { InfosExploitation } from '@/features/settings/settings';
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

function enTeteExploitationHtml(infos: InfosExploitation | undefined): string {
  if (!infos) return '';
  const identite = [infos.nomExploitant, infos.adresseExploitant].filter(Boolean).map(echapper);
  const champs: [string, string | undefined][] = [
    [TEXTES.export.pdfExport.nExploitation, infos.numeroExploitation],
    [TEXTES.commun.general.siret, infos.siret],
    [TEXTES.commun.general.nCheptel, infos.numeroCheptel],
    [TEXTES.commun.general.indicatifDeMarquage, infos.indicatifMarquage],
    [TEXTES.export.pdfExport.nPacage, infos.numeroPacage],
    [TEXTES.export.pdfExport.nDetenteur, infos.numeroDetenteur],
  ];
  const champsRenseignes = champs.filter(([, v]) => !!v);
  if (identite.length === 0 && champsRenseignes.length === 0) return '';

  const ligneIdentite = identite.length > 0 ? `<div>${identite.join(' — ')}</div>` : '';
  const ligneChamps =
    champsRenseignes.length > 0
      ? `<div class="exploitation-grid">${champsRenseignes
          .map(([label, v]) => `<span><strong>${label} :</strong> ${echapper(v)}</span>`)
          .join('')}</div>`
      : '';
  return `<div class="exploitation">${ligneIdentite}${ligneChamps}</div>`;
}

/** Document HTML complet : feuille de style, titre, en-tête de l'exploitation puis le corps. */
export function documentHtml(titre: string, infos: InfosExploitation | undefined, corps: string): string {
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
  ${enTeteExploitationHtml(infos)}
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
