import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { FORMAT_EXPORT, MIME_XLSX, UTI_XLSX } from '@/shared/constants/export';

/** Feuille issue des lignes, ou une feuille d'une seule cellule (`messageVide`) quand il n'y en a pas. */
export function feuilleOuMessage(rows: Record<string, unknown>[], messageVide: string): XLSX.WorkSheet {
  return rows.length > 0 ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([[messageVide]]);
}

/** Écrit le classeur dans le cache sous `nomFichier` et ouvre le menu de partage. */
export async function ecrireEtPartager(
  workbook: XLSX.WorkBook,
  nomFichier: string,
  titre: string,
): Promise<void> {
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: FORMAT_EXPORT.XLSX });
  const fileUri = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(fileUri, {
      mimeType: MIME_XLSX,
      dialogTitle: titre,
      UTI: UTI_XLSX,
    });
  }
}
