import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import {
  COMPTES_PCG_DEPENSE,
  COMPTES_PCG_RECETTE,
  type CompteComptable,
} from '@/shared/constants/planComptable';
import { cleStockage } from '@/features/etablissements/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.COMPTES_PCG);

export interface CompteComptableEnregistre extends CompteComptable {
  id: string;
}

function comptesInitiaux(): CompteComptableEnregistre[] {
  const numeros = new Set<string>();
  const comptes: CompteComptableEnregistre[] = [];
  for (const c of [...COMPTES_PCG_DEPENSE, ...COMPTES_PCG_RECETTE]) {
    if (numeros.has(c.numero)) continue;
    numeros.add(c.numero);
    comptes.push({ id: generateId(), ...c });
  }
  return comptes;
}

async function lireTous(): Promise<CompteComptableEnregistre[]> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) {
    const initiaux = comptesInitiaux();
    await ecrireTous(initiaux);
    return initiaux;
  }
  try {
    return JSON.parse(raw) as CompteComptableEnregistre[];
  } catch {
    return [];
  }
}

async function ecrireTous(items: CompteComptableEnregistre[]): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(items));
}

/** Comptes PCG triés par numéro, pour la liste et les sélecteurs. */
export async function listComptesPcg(): Promise<CompteComptableEnregistre[]> {
  const items = await lireTous();
  return items.sort((a, b) => a.numero.localeCompare(b.numero));
}

export async function getComptePcg(id: string): Promise<CompteComptableEnregistre | undefined> {
  const items = await lireTous();
  return items.find((c) => c.id === id);
}

export async function creerComptePcg(
  input: Omit<CompteComptableEnregistre, 'id'>,
): Promise<CompteComptableEnregistre> {
  const compte: CompteComptableEnregistre = { id: generateId(), ...input };
  const items = await lireTous();
  items.push(compte);
  await ecrireTous(items);
  return compte;
}

export async function enregistrerComptePcg(compte: CompteComptableEnregistre): Promise<void> {
  const items = await lireTous();
  const idx = items.findIndex((c) => c.id === compte.id);
  if (idx >= 0) items[idx] = compte;
  else items.push(compte);
  await ecrireTous(items);
}

export async function supprimerComptePcg(id: string): Promise<void> {
  const items = await lireTous();
  await ecrireTous(items.filter((c) => c.id !== id));
}

/** Remplace intégralement la liste locale — utilisé lors d'un tirage depuis Google Drive. */
export async function remplacerTousComptesPcg(items: CompteComptableEnregistre[]): Promise<void> {
  await ecrireTous(items);
}
