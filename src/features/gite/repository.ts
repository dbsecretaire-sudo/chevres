import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage } from '@/features/etablissements/repository';
import type { ArchiveGite, Sejour } from '@/features/gite/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.GITE);

/** Les séjours de l'établissement actif (aucun s'il n'y en a pas encore). */
export async function lireArchiveGite(): Promise<ArchiveGite> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return { sejours: [] };
  try {
    const archive = JSON.parse(raw) as Partial<ArchiveGite>;
    return { sejours: Array.isArray(archive.sejours) ? archive.sejours : [] };
  } catch {
    return { sejours: [] };
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveGite(archive: ArchiveGite): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
}

/** Tous les séjours, du plus ancien au plus récent. */
export async function listSejours(): Promise<Sejour[]> {
  const { sejours } = await lireArchiveGite();
  return [...sejours].sort((a, b) => a.arrivee.localeCompare(b.arrivee));
}

export async function getSejour(id: string): Promise<Sejour | undefined> {
  return (await lireArchiveGite()).sejours.find((s) => s.id === id);
}

/** Crée le séjour (sans identifiant) ou met à jour celui qui en a un. */
export async function enregistrerSejour(sejour: Omit<Sejour, 'id'> & { id?: string }): Promise<Sejour> {
  const archive = await lireArchiveGite();
  const complet: Sejour = { ...sejour, id: sejour.id ?? generateId() };
  const i = archive.sejours.findIndex((s) => s.id === complet.id);
  if (i >= 0) archive.sejours[i] = complet;
  else archive.sejours.push(complet);
  await remplacerArchiveGite(archive);
  return complet;
}

export async function supprimerSejour(id: string): Promise<void> {
  const archive = await lireArchiveGite();
  await remplacerArchiveGite({ sejours: archive.sejours.filter((s) => s.id !== id) });
}
