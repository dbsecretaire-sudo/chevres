import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import type { DocumentIdentification } from '@/features/identification/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import { generateId } from '@/shared/utils/id';

const cle = () => cleStockage(CLE_STOCKAGE.IDENTIFICATION);

async function lireTous(): Promise<DocumentIdentification[]> {
  const brut = await AsyncStorage.getItem(cle());
  if (!brut) return [];
  try {
    return JSON.parse(brut) as DocumentIdentification[];
  } catch {
    return [];
  }
}

async function ecrireTous(documents: DocumentIdentification[]): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(documents));
}

/** Les documents d'identification de l'établissement, du plus récent au plus ancien. */
export async function listDocumentsIdentification(): Promise<DocumentIdentification[]> {
  return (await lireTous()).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDocumentIdentification(id: string): Promise<DocumentIdentification | undefined> {
  return (await lireTous()).find((d) => d.id === id);
}

/** Ajoute (sans identifiant) ou modifie un document d'identification. */
export async function enregistrerDocumentIdentification(
  document: Omit<DocumentIdentification, 'id'> & { id?: string },
): Promise<DocumentIdentification> {
  const complet: DocumentIdentification = { ...document, id: document.id ?? generateId() };
  const tous = await lireTous();
  await ecrireTous(
    tous.some((d) => d.id === complet.id) ? tous.map((d) => (d.id === complet.id ? complet : d)) : [...tous, complet],
  );
  return complet;
}

/** Remplace tous les documents d'identification (restauration d'une sauvegarde). */
export async function remplacerTousDocumentsIdentification(documents: DocumentIdentification[]): Promise<void> {
  await ecrireTous(documents);
}

export async function supprimerDocumentIdentification(id: string): Promise<void> {
  await ecrireTous((await lireTous()).filter((d) => d.id !== id));
}
