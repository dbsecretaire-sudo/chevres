import { fileNameFor, fromCSV, toCSV } from '@/shared/storage/csv';
import { CATEGORIES_STOCKAGE } from '@/shared/constants/csv';
import { loadYear, reindexYear, saveYear } from '@/shared/storage/localStore';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { getSettings, updateSettings } from '@/features/settings/settings';
import { listFournisseurs, remplacerTousFournisseurs } from '@/features/fournisseurs/repository';
import { listClients, remplacerTousClients } from '@/features/clients/repository';
import {
  appliquerProfilEtablissementActif,
  profilEtablissementActif,
} from '@/features/etablissements/repository';
import { listComptesPcg, remplacerTousComptesPcg } from '@/features/comptes-pcg/repository';
import {
  ensureFolder,
  upsertFileText,
  downloadFileText,
  findFile,
  listFiles,
} from '@/features/drive/driveApi';
import type { Categorie } from '@/shared/storage/types';
import {
  DOSSIER_RACINE_DRIVE,
  FICHIER_CLIENTS,
  FICHIER_COMPTES_PCG,
  FICHIER_ETABLISSEMENT,
  FICHIER_EXPLOITATION,
  FICHIER_FOURNISSEURS,
  MOTIF_FICHIER_ANNEE,
} from '@/shared/constants/drive';

/** Un dossier Drive par établissement : l'établissement historique garde le nom d'origine. */
export function nomDossierDrive(nomEtablissement: string, estDefaut: boolean): string {
  return estDefaut ? DOSSIER_RACINE_DRIVE : `${DOSSIER_RACINE_DRIVE} — ${nomEtablissement}`;
}

export async function ensureRootFolder(
  accessToken: string,
  nomDossier: string = DOSSIER_RACINE_DRIVE,
): Promise<string> {
  const folder = await ensureFolder(accessToken, nomDossier);
  return folder.id;
}

/** Envoie les informations de l'exploitation (écran Accueil) vers Google Drive. */
export async function pousserInfosExploitation(accessToken: string, folderId: string): Promise<void> {
  const settings = await getSettings();
  await upsertFileText(
    accessToken,
    FICHIER_EXPLOITATION,
    folderId,
    JSON.stringify(settings.exploitation ?? {}),
  );
}

/** Récupère les informations de l'exploitation depuis Google Drive, si présentes. */
export async function tirerInfosExploitation(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_EXPLOITATION, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await updateSettings({ exploitation: JSON.parse(json) });
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les infos locales.
  }
}

/** Envoie les espèces et activités de l'établissement vers Google Drive. */
export async function pousserEtablissement(accessToken: string, folderId: string): Promise<void> {
  const profil = await profilEtablissementActif();
  await upsertFileText(accessToken, FICHIER_ETABLISSEMENT, folderId, JSON.stringify(profil));
}

/** Récupère les espèces et activités de l'établissement depuis Google Drive, si présentes (sans toucher à son nom). */
export async function tirerEtablissement(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_ETABLISSEMENT, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await appliquerProfilEtablissementActif(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les types locaux.
  }
}

/** Envoie la liste des fournisseurs vers Google Drive. */
export async function pousserFournisseurs(accessToken: string, folderId: string): Promise<void> {
  const fournisseurs = await listFournisseurs();
  await upsertFileText(accessToken, FICHIER_FOURNISSEURS, folderId, JSON.stringify(fournisseurs));
}

/** Récupère la liste des fournisseurs depuis Google Drive, si présente (remplace la liste locale). */
export async function tirerFournisseurs(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_FOURNISSEURS, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await remplacerTousFournisseurs(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie la liste des clients vers Google Drive. */
export async function pousserClients(accessToken: string, folderId: string): Promise<void> {
  const clients = await listClients();
  await upsertFileText(accessToken, FICHIER_CLIENTS, folderId, JSON.stringify(clients));
}

/** Récupère la liste des clients depuis Google Drive, si présente (remplace la liste locale). */
export async function tirerClients(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_CLIENTS, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await remplacerTousClients(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie la liste des comptes PCG vers Google Drive. */
export async function pousserComptesPcg(accessToken: string, folderId: string): Promise<void> {
  const comptes = await listComptesPcg();
  await upsertFileText(accessToken, FICHIER_COMPTES_PCG, folderId, JSON.stringify(comptes));
}

/** Récupère la liste des comptes PCG depuis Google Drive, si présente (remplace la liste locale). */
export async function tirerComptesPcg(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_COMPTES_PCG, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await remplacerTousComptesPcg(JSON.parse(json));
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
  for (const categorie of CATEGORIES_STOCKAGE) {
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
  for (const categorie of CATEGORIES_STOCKAGE) {
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
  await pousserEtablissement(accessToken, folderId);
  await pousserFournisseurs(accessToken, folderId);
  await pousserClients(accessToken, folderId);
  await pousserComptesPcg(accessToken, folderId);
}

/** Déduit les années présentes dans le dossier Drive à partir des noms de fichiers. */
export async function anneesDisponiblesSurDrive(accessToken: string, folderId: string): Promise<number[]> {
  const files = await listFiles(accessToken, folderId);
  const annees = new Set<number>();
  for (const f of files) {
    const match = f.name.match(MOTIF_FICHIER_ANNEE);
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
  await tirerEtablissement(accessToken, folderId);
  await tirerFournisseurs(accessToken, folderId);
  await tirerClients(accessToken, folderId);
  await tirerComptesPcg(accessToken, folderId);
}
