import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/id';
import type { Fournisseur } from '@/types/models';

const KEY = 'troupeau:v1:fournisseurs';

async function lireTous(): Promise<Fournisseur[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Fournisseur[];
  } catch {
    return [];
  }
}

async function ecrireTous(items: Fournisseur[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

/** Fournisseurs triés par nom, pour la liste et les sélecteurs. */
export async function listFournisseurs(): Promise<Fournisseur[]> {
  const items = await lireTous();
  return items.sort((a, b) => a.nom.localeCompare(b.nom));
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
