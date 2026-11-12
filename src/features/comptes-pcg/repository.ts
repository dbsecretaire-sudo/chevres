import AsyncStorage from '@react-native-async-storage/async-storage';
import { ecrireDonnee } from '@/shared/storage/depot';
import { generateId } from '@/shared/utils/id';
import {
  COMPTES_PCG_DEPENSE,
  COMPTES_PCG_RECETTE,
  COMPTE_BOUCLES,
  COMPTE_PAR_DEPENSE,
  COMPTE_PAR_RECETTE,
  type CompteComptable,
} from '@/shared/constants/planComptable';
import { cleStockage } from '@/features/etablissements/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.COMPTES_PCG);

export interface CompteComptableEnregistre extends CompteComptable {
  id: string;
  /** Les espèces pour lesquelles le compte est retiré (il n'y est plus proposé) ; il reste pour les autres. */
  masquePour?: string[];
}

/** Vrai quand le compte est proposé à l'une de ces espèces (au moins une ne l'a pas retiré). */
export const compteProposePour = (
  c: Pick<CompteComptableEnregistre, 'masquePour'>,
  especes: readonly string[],
): boolean => especes.length === 0 || especes.some((e) => !(c.masquePour ?? []).includes(e));

/**
 * L'identifiant d'un compte du plan de départ : le même sur tous les appareils. Avec un identifiant tiré au hasard, deux appareils qui
 * créent le plan se synchronisent avec deux comptes pour un même numéro (c'est ce qui créait les doublons).
 */
const idCompteInitial = (numero: string): string => `pcg-${numero}`;

/** Un seul compte par numéro : garde le premier. Efface les doublons déjà synchronisés avant l'identifiant fixe. */
function sansDoublons(comptes: CompteComptableEnregistre[]): CompteComptableEnregistre[] {
  const vus = new Set<string>();
  return comptes.filter((c) => {
    if (vus.has(c.numero)) return false;
    vus.add(c.numero);
    return true;
  });
}

function comptesInitiaux(): CompteComptableEnregistre[] {
  return sansDoublons(
    [...COMPTES_PCG_DEPENSE, ...COMPTES_PCG_RECETTE].map((c) => ({ id: idCompteInitial(c.numero), ...c })),
  );
}

/**
 * Les comptes affectés automatiquement à une catégorie (ex : ventes de viande) doivent figurer dans le plan :
 * ceux qui manquent (ajoutés par une mise à jour de l'app) sont ajoutés, sans toucher au reste.
 */
function avecComptesAutomatiques(comptes: CompteComptableEnregistre[]): CompteComptableEnregistre[] {
  // Le 601500 est celui des boucles : un plan enregistré avec son ancien libellé (fournitures de production) le reprend.
  comptes = comptes.map((c) =>
    c.numero === COMPTE_BOUCLES.numero && c.libelle !== COMPTE_BOUCLES.libelle
      ? { ...c, libelle: COMPTE_BOUCLES.libelle }
      : c,
  );
  const numeros = new Set(comptes.map((c) => c.numero));
  const manquants = [
    COMPTE_BOUCLES,
    ...Object.values(COMPTE_PAR_DEPENSE),
    ...Object.values(COMPTE_PAR_RECETTE),
  ].filter((c) => {
    if (numeros.has(c.numero)) return false;
    numeros.add(c.numero);
    return true;
  });
  return manquants.length > 0 ? [...comptes, ...manquants.map((c) => ({ id: idCompteInitial(c.numero), ...c }))] : comptes;
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
    const complets = sansDoublons(avecComptesAutomatiques(enregistres));
    if (complets.length !== enregistres.length) await ecrireTous(complets);
    return complets;
  } catch {
    return [];
  }
}

async function ecrireTous(items: CompteComptableEnregistre[]): Promise<void> {
  await ecrireDonnee(cle(), items);
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

/** Retire le compte pour une espèce seulement : il n'y est plus proposé, et reste pour les autres. */
export async function retirerComptePourEspece(id: string, espece: string): Promise<void> {
  const items = await lireTous();
  await ecrireTous(
    items.map((c) =>
      c.id === id ? { ...c, masquePour: [...new Set([...(c.masquePour ?? []), espece])] } : c,
    ),
  );
}

/** Rend le compte à toutes les espèces. */
export async function retablirCompte(id: string): Promise<void> {
  const items = await lireTous();
  await ecrireTous(items.map((c) => (c.id === id ? { ...c, masquePour: undefined } : c)));
}

/** Remplace intégralement la liste locale — utilisé lors d'un tirage depuis Google Drive. */
export async function remplacerTousComptesPcg(items: CompteComptableEnregistre[]): Promise<void> {
  await ecrireTous(items);
}
