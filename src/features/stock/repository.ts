import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import { avecNomsHarmonises, sansDoublonsDOffice } from '@/features/stock/utils/doublonsListes';
import { avecListeDenrees } from '@/features/stock/services/denrees';
import { avecRemisesAZero, estRemiseAZero } from '@/features/stock/services/remisesAZero';
import type { PieceJointe } from '@/features/fichiers/types';
import type { ArchiveStock, ReglageCategorie } from '@/features/stock/types';
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

/** Les listes d'office retirées pour des espèces : celles bien formées (section → liste d'espèces). */
function sectionsMasqueesValides(brut: ArchiveStock['sectionsMasquees']): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  for (const [section, especes] of Object.entries(brut ?? {})) {
    if (Array.isArray(especes)) sections[section] = especes.filter((e) => typeof e === 'string');
  }
  return sections;
}

/** Ce qui est personnalisé d'une catégorie d'office : les réglages bien formés. */
function reglagesValides(brut: ArchiveStock['reglagesCategories']): Record<string, ReglageCategorie> {
  const reglages: Record<string, ReglageCategorie> = {};
  for (const [categorie, r] of Object.entries(brut ?? {})) {
    if (!r || typeof r !== 'object') continue;
    const reglage: ReglageCategorie = {};
    if (typeof r.nom === 'string' && r.nom.trim()) reglage.nom = r.nom;
    if (typeof r.classe === 'string' && r.classe.trim()) reglage.classe = r.classe;
    if (
      Array.isArray(r.prefixes) &&
      r.prefixes.length > 0 &&
      r.prefixes.every((p) => typeof p === 'string')
    ) {
      reglage.prefixes = r.prefixes;
    }
    if (Object.keys(reglage).length > 0) reglages[categorie] = reglage;
  }
  return reglages;
}

/** Remet une archive lue (ou reçue d'une sauvegarde) dans sa forme : rien ne manque, un conditionnement est une liste. */
/** Les fabrications de plats lues : celles dont les ingrédients forment bien une liste. */
function platsValides(plats: ArchiveStock['platsFabriques']): ArchiveStock['platsFabriques'] {
  const valides: NonNullable<ArchiveStock['platsFabriques']> = {};
  for (const [id, p] of Object.entries(plats ?? {})) {
    if (p && Array.isArray(p.ingredients)) valides[id] = p;
  }
  return valides;
}

export function normaliserArchiveStock(archive: Partial<ArchiveStock> | undefined): ArchiveStock {
  const conditionnements: ArchiveStock['conditionnements'] = {};
  for (const [code, emballages] of Object.entries(archive?.conditionnements ?? {})) {
    if (Array.isArray(emballages)) conditionnements[code] = emballages;
  }
  const conditionnementsParAnnee: Record<string, Record<string, string[]>> = {};
  for (const [annee, parCode] of Object.entries(archive?.conditionnementsParAnnee ?? {})) {
    if (!parCode || typeof parCode !== 'object') continue;
    const valides: Record<string, string[]> = {};
    for (const [code, emballages] of Object.entries(parCode)) {
      if (Array.isArray(emballages)) valides[code] = emballages;
    }
    if (Object.keys(valides).length > 0) conditionnementsParAnnee[annee] = valides;
  }
  const ordres: ArchiveStock['ordres'] = {};
  for (const [genre, cles] of Object.entries(archive?.ordres ?? {})) {
    if (Array.isArray(cles)) ordres[genre as keyof ArchiveStock['ordres']] = cles;
  }
  const noms: ArchiveStock['noms'] = {};
  for (const [cle, nom] of Object.entries(archive?.noms ?? {})) {
    if (typeof nom === 'string' && nom.trim()) noms[cle] = nom;
  }
  const images: Record<string, PieceJointe> = {};
  for (const [cle, piece] of Object.entries(archive?.images ?? {})) {
    if (piece && typeof piece.id === 'string' && typeof piece.extension === 'string') images[cle] = piece;
  }
  const prix: ArchiveStock['prix'] = {};
  for (const [cle, montant] of Object.entries(archive?.prix ?? {})) {
    if (typeof montant === 'number' && montant > 0) prix[cle] = montant;
  }
  const litresParFromage: Record<string, number> = {};
  for (const [cle, litres] of Object.entries(archive?.litresParFromage ?? {})) {
    if (typeof litres === 'number' && litres > 0) litresParFromage[cle] = litres;
  }
  return {
    mouvements: Array.isArray(archive?.mouvements) ? archive.mouvements : [],
    articles: Array.isArray(archive?.articles) ? archive.articles : [],
    conditionnements,
    conditionnementsParAnnee,
    ordres,
    noms,
    images,
    lait: Array.isArray(archive?.lait) ? archive.lait : [],
    prix,
    litresParFromage,
    listes: Array.isArray(archive?.listes)
      ? archive.listes.filter(
          (l) => l && typeof l.id === 'string' && typeof l.nom === 'string' && typeof l.compte === 'string',
        )
      : [],
    categories: Array.isArray(archive?.categories)
      ? archive.categories.filter(
          (c) =>
            c &&
            typeof c.id === 'string' &&
            typeof c.nom === 'string' &&
            typeof c.classe === 'string' &&
            Array.isArray(c.prefixes),
        )
      : [],
    reglagesCategories: reglagesValides(archive?.reglagesCategories),
    boucles: Array.isArray(archive?.boucles)
      ? archive.boucles.filter(
          (b) =>
            b && typeof b.id === 'string' && typeof b.numero === 'string' && typeof b.article === 'string',
        )
      : [],
    lots: Array.isArray(archive?.lots)
      ? archive.lots.filter(
          (l) =>
            l && typeof l.id === 'string' && typeof l.numero === 'string' && typeof l.article === 'string',
        )
      : [],
    platsFabriques: platsValides(archive?.platsFabriques),
    masques: Array.isArray(archive?.masques) ? archive.masques.filter((cle) => typeof cle === 'string') : [],
    sectionsMasquees: sectionsMasqueesValides(archive?.sectionsMasquees),
    denreesAjoutees: archive?.denreesAjoutees === true ? true : undefined,
  };
}

/** Le stock de l'établissement actif (vide s'il n'y a encore rien), avec la remise à zéro des aliments à chaque nouvel achat. */
export async function lireArchiveStock(): Promise<ArchiveStock> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return avecNomsHarmonises(avecListeDenrees({ ...VIDE }));
  try {
    const archive = avecNomsHarmonises(sansDoublonsDOffice(avecListeDenrees(normaliserArchiveStock(JSON.parse(raw)))));
    return { ...archive, mouvements: avecRemisesAZero(archive.mouvements) };
  } catch {
    return avecNomsHarmonises(avecListeDenrees({ ...VIDE }));
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
