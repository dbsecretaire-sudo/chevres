import { CATEGORIES, fileNameFor, fromCSV, toCSV } from '@/storage/csv';
import { loadYear, reindexYear, saveYear } from '@/storage/localStore';
import { toutesLesAnneesConnues } from '@/storage/repositories';
import { getSettings, updateSettings } from '@/storage/settings';
import { listFournisseurs, remplacerTousFournisseurs } from '@/storage/fournisseurs';
import { ensureFolder, upsertFileText, downloadFileText, findFile, listFiles } from './driveApi';
import type { Categorie } from '@/types/models';

const ROOT_FOLDER_NAME = 'Troupeau Chèvres';
const EXPLOITATION_FILE_NAME = 'exploitation.json';
const FOURNISSEURS_FILE_NAME = 'fournisseurs.json';

export async function ensureRootFolder(accessToken: string): Promise<string> {
  const folder = await ensureFolder(accessToken, ROOT_FOLDER_NAME);
  return folder.id;
}

/** Envoie les informations de l'exploitation (écran Accueil) vers Google Drive. */
export async function pousserInfosExploitation(accessToken: string, folderId: string): Promise<void> {
  const settings = await getSettings();
  await upsertFileText(accessToken, EXPLOITATION_FILE_NAME, folderId, JSON.stringify(settings.exploitation ?? {}));
}

/** Récupère les informations de l'exploitation depuis Google Drive, si présentes. */
export async function tirerInfosExploitation(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, EXPLOITATION_FILE_NAME, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await updateSettings({ exploitation: JSON.parse(json) });
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les infos locales.
  }
}

/** Envoie la liste des fournisseurs vers Google Drive. */
export async function pousserFournisseurs(accessToken: string, folderId: string): Promise<void> {
  const fournisseurs = await listFournisseurs();
  await upsertFileText(accessToken, FOURNISSEURS_FILE_NAME, folderId, JSON.stringify(fournisseurs));
}

/** Récupère la liste des fournisseurs depuis Google Drive, si présente (remplace la liste locale). */
export async function tirerFournisseurs(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FOURNISSEURS_FILE_NAME, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await remplacerTousFournisseurs(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie les données locales de l'année vers Google Drive (écrase le fichier distant). */
export async function pousserAnnee(
  accessToken: string,
  folderId: string,
  annee: number,
  onProgress?: (categorie: Categorie) => void,
): Promise<void> {
  for (const categorie of CATEGORIES) {
    onProgress?.(categorie);
    const items = await loadYear(categorie, annee);
    const csv = toCSV(categorie, items);
    await upsertFileText(accessToken, fileNameFor(categorie, annee), folderId, csv);
  }
}

/** Récupère les données de l'année depuis Google Drive (écrase les données locales). */
export async function tirerAnnee(
  accessToken: string,
  folderId: string,
  annee: number,
  onProgress?: (categorie: Categorie) => void,
): Promise<void> {
  for (const categorie of CATEGORIES) {
    onProgress?.(categorie);
    const fileName = fileNameFor(categorie, annee);
    const file = await findFile(accessToken, fileName, folderId);
    if (!file) continue;
    const csv = await downloadFileText(accessToken, file.id);
    const items = fromCSV(categorie, csv);
    await saveYear(categorie, annee, items as any);
    await reindexYear(categorie, annee, items as any);
  }
}

export async function pousserToutesAnnees(
  accessToken: string,
  folderId: string,
  onProgress?: (annee: number, categorie: Categorie) => void,
): Promise<void> {
  const annees = await toutesLesAnneesConnues();
  for (const annee of annees) {
    await pousserAnnee(accessToken, folderId, annee, (c) => onProgress?.(annee, c));
  }
  await pousserInfosExploitation(accessToken, folderId);
  await pousserFournisseurs(accessToken, folderId);
}

/** Déduit les années présentes dans le dossier Drive à partir des noms de fichiers. */
export async function anneesDisponiblesSurDrive(accessToken: string, folderId: string): Promise<number[]> {
  const files = await listFiles(accessToken, folderId);
  const annees = new Set<number>();
  for (const f of files) {
    const match = f.name.match(/_(\d{4})\.csv$/);
    if (match) annees.add(Number(match[1]));
  }
  return Array.from(annees).sort((a, b) => b - a);
}

/** Tire toutes les années connues localement, plus celles trouvées sur Drive (utile lors d'une première synchronisation sur un nouvel appareil). */
export async function tirerToutesAnnees(
  accessToken: string,
  folderId: string,
  onProgress?: (annee: number, categorie: Categorie) => void,
): Promise<void> {
  const [locales, distantes] = await Promise.all([
    toutesLesAnneesConnues(),
    anneesDisponiblesSurDrive(accessToken, folderId),
  ]);
  const annees = Array.from(new Set([...locales, ...distantes])).sort((a, b) => b - a);
  for (const annee of annees) {
    await tirerAnnee(accessToken, folderId, annee, (c) => onProgress?.(annee, c));
  }
  await tirerInfosExploitation(accessToken, folderId);
  await tirerFournisseurs(accessToken, folderId);
}
