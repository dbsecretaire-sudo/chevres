import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage, cleStockagePour } from '@/features/etablissements/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.FOURNISSEURS);

async function lireTous(cleLecture: string = cle()): Promise<Fournisseur[]> {
  const raw = await AsyncStorage.getItem(cleLecture);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Fournisseur[];
  } catch {
    return [];
  }
}

async function ecrireTous(items: Fournisseur[]): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(items));
}

/** Fournisseurs triés par nom, pour la liste et les sélecteurs. */
export async function listFournisseurs(): Promise<Fournisseur[]> {
  const items = await lireTous();
  return items.sort((a, b) => a.nom.localeCompare(b.nom));
}

/** Fournisseurs d'un autre établissement (lecture seule), triés par nom — pour les importer dans l'établissement actif. */
export async function listFournisseursDeEtablissement(etablissementId: string): Promise<Fournisseur[]> {
  const items = await lireTous(cleStockagePour(etablissementId, CLE_STOCKAGE.FOURNISSEURS));
  return items.sort((a, b) => a.nom.localeCompare(b.nom));
}

/**
 * Copie un fournisseur d'un autre établissement dans l'établissement actif (nouvel identifiant).
 * Renvoie undefined, sans rien copier, s'il y existe déjà un fournisseur avec le même SIRET.
 */
export async function importerFournisseur(source: Fournisseur): Promise<Fournisseur | undefined> {
  const existants = await lireTous();
  if (existants.some((f) => f.siret === source.siret)) return undefined;
  const { id: _id, ...donnees } = source;
  return creerFournisseur(donnees);
}

export async function getFournisseur(id: string): Promise<Fournisseur | undefined> {
  const items = await lireTous();
  return items.find((f) => f.id === id);
}

export async function creerFournisseur(input: Omit<Fournisseur, 'id'>): Promise<Fournisseur> {
  const fournisseur: Fournisseur = { id: generateId(), ...input };
  const items = await lireTous();
  items.push(fournisseur);
  await ecrireTous(items);
  return fournisseur;
}

export async function enregistrerFournisseur(fournisseur: Fournisseur): Promise<void> {
  const items = await lireTous();
  const idx = items.findIndex((f) => f.id === fournisseur.id);
  if (idx >= 0) items[idx] = fournisseur;
  else items.push(fournisseur);
  await ecrireTous(items);
}

export async function supprimerFournisseur(id: string): Promise<void> {
  const items = await lireTous();
  await ecrireTous(items.filter((f) => f.id !== id));
}

/** Remplace intégralement la liste locale — utilisé lors d'un tirage depuis Google Drive. */
export async function remplacerTousFournisseurs(items: Fournisseur[]): Promise<void> {
  await ecrireTous(items);
}
