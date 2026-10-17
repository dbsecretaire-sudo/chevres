import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import type { DocumentGenere } from '@/features/bibliotheque/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.BIBLIOTHEQUE);

/** Remet une liste lue (ou reçue d'une sauvegarde) dans sa forme : seulement des documents complets. */
export function normaliserBibliotheque(liste: unknown): DocumentGenere[] {
  if (!Array.isArray(liste)) return [];
  return liste.filter(
    (d): d is DocumentGenere => !!d && typeof d.id === 'string' && typeof d.titre === 'string' && !!d.piece && typeof d.piece.id === 'string',
  );
}

/** Les documents générés de l'établissement actif, les plus récents d'abord. */
export async function lireBibliotheque(): Promise<DocumentGenere[]> {
  const brut = await AsyncStorage.getItem(cle());
  if (!brut) return [];
  try {
    return normaliserBibliotheque(JSON.parse(brut)).sort((a, b) => b.genereLe.localeCompare(a.genereLe));
  } catch {
    return [];
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerBibliotheque(liste: DocumentGenere[]): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(normaliserBibliotheque(liste)));
}

export async function ajouterDocument(document: DocumentGenere): Promise<void> {
  await remplacerBibliotheque([document, ...(await lireBibliotheque())]);
}

export async function retirerDocument(id: string): Promise<void> {
  await remplacerBibliotheque((await lireBibliotheque()).filter((d) => d.id !== id));
}
