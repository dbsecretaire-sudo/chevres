import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import { avecRemisesAZero, estRemiseAZero } from '@/features/stock/services/remisesAZero';
import type { ArchiveStock } from '@/features/stock/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.STOCK);

const VIDE: ArchiveStock = {
  mouvements: [],
  articles: [],
  conditionnements: {},
  ordres: {},
  noms: {},
  lait: [],
  prix: {},
};

/** Remet une archive lue (ou reçue d'une sauvegarde) dans sa forme : rien ne manque, un conditionnement est une liste. */
export function normaliserArchiveStock(archive: Partial<ArchiveStock> | undefined): ArchiveStock {
  const conditionnements: ArchiveStock['conditionnements'] = {};
  for (const [code, emballages] of Object.entries(archive?.conditionnements ?? {})) {
    if (Array.isArray(emballages)) conditionnements[code] = emballages;
  }
  const ordres: ArchiveStock['ordres'] = {};
  for (const [genre, cles] of Object.entries(archive?.ordres ?? {})) {
    if (Array.isArray(cles)) ordres[genre as keyof ArchiveStock['ordres']] = cles;
  }
  const noms: ArchiveStock['noms'] = {};
  for (const [cle, nom] of Object.entries(archive?.noms ?? {})) {
    if (typeof nom === 'string' && nom.trim()) noms[cle] = nom;
  }
  const prix: ArchiveStock['prix'] = {};
  for (const [cle, montant] of Object.entries(archive?.prix ?? {})) {
    if (typeof montant === 'number' && montant > 0) prix[cle] = montant;
  }
  return {
    mouvements: Array.isArray(archive?.mouvements) ? archive.mouvements : [],
    articles: Array.isArray(archive?.articles) ? archive.articles : [],
    conditionnements,
    ordres,
    noms,
    lait: Array.isArray(archive?.lait) ? archive.lait : [],
    prix,
    masques: Array.isArray(archive?.masques) ? archive.masques.filter((cle) => typeof cle === 'string') : [],
  };
}

/** Le stock de l'établissement actif (vide s'il n'y a encore rien), avec la remise à zéro des aliments à chaque nouvel achat. */
export async function lireArchiveStock(): Promise<ArchiveStock> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return { ...VIDE };
  try {
    const archive = normaliserArchiveStock(JSON.parse(raw));
    return { ...archive, mouvements: avecRemisesAZero(archive.mouvements) };
  } catch {
    return { ...VIDE };
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveStock(archive: ArchiveStock): Promise<void> {
  // Les remises à zéro se déduisent à chaque lecture : on ne les enregistre pas.
  await AsyncStorage.setItem(
    cle(),
    JSON.stringify({ ...archive, mouvements: archive.mouvements.filter((m) => !estRemiseAZero(m)) }),
  );
}
