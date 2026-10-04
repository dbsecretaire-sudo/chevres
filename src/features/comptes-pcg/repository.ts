import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import {
  COMPTES_PCG_DEPENSE,
  COMPTES_PCG_RECETTE,
  COMPTE_PAR_DEPENSE,
  COMPTE_PAR_RECETTE,
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

/**
 * Les comptes affectés automatiquement à une catégorie (ex : ventes de viande) doivent figurer dans le plan :
 * ceux qui manquent (ajoutés par une mise à jour de l'app) sont ajoutés, sans toucher au reste.
 */
function avecComptesAutomatiques(comptes: CompteComptableEnregistre[]): CompteComptableEnregistre[] {
  const numeros = new Set(comptes.map((c) => c.numero));
  const manquants = [...Object.values(COMPTE_PAR_DEPENSE), ...Object.values(COMPTE_PAR_RECETTE)].filter(
    (c) => {
      if (numeros.has(c.numero)) return false;
      numeros.add(c.numero);
      return true;
    },
  );
  return manquants.length > 0 ? [...comptes, ...manquants.map((c) => ({ id: generateId(), ...c }))] : comptes;
}

async function lireTous(): Promise<CompteComptableEnregistre[]> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) {
    const initiaux = comptesInitiaux();
    await ecrireTous(initiaux);
    return initiaux;
  }
  try {
    const enregistres = JSON.parse(raw) as CompteComptableEnregistre[];
    const complets = avecComptesAutomatiques(enregistres);
    if (complets.length !== enregistres.length) await ecrireTous(complets);
    return complets;
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
