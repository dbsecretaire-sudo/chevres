import AsyncStorage from '@react-native-async-storage/async-storage';
import { empreintesDe, type Empreintes } from '@/features/drive/fusion';
import { cleStockage } from '@/features/etablissements/repository';
import { SEPARATEUR_CLE } from '@/shared/constants/stockage';

/**
 * L'état de chaque donnée à la dernière synchronisation avec Drive, propre à cet appareil et à l'établissement ouvert : c'est ce qui permet à la fusion de savoir
 * qu'un élément a été supprimé (il y était, il n'y est plus) ou modifié d'un seul côté, au lieu de le remettre. Sans base, la fusion ne fait que réunir.
 */
const cle = (nom: string): string => cleStockage(['drive-base', nom].join(SEPARATEUR_CLE));

/** Le nom de la base d'une année d'une catégorie, et celui d'un fichier de réglages. */
export const baseDeLAnnee = (categorie: string, annee: number): string => `categorie:${categorie}:${annee}`;
export const baseDuFichier = (fichier: string): string => `fichier:${fichier}`;

export async function lireBase(nom: string): Promise<Empreintes | undefined> {
  try {
    const brut = await AsyncStorage.getItem(cle(nom));
    return brut ? (JSON.parse(brut) as Empreintes) : undefined;
  } catch {
    return undefined;
  }
}

/** Garde l'état d'une donnée comme étant celui de la dernière synchronisation. */
export async function noterBase(nom: string, valeur: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(cle(nom), JSON.stringify(empreintesDe(valeur)));
  } catch {
    // Pas de base : la prochaine fusion ne fera que réunir, comme avant.
  }
}
