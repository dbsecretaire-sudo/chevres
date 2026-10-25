import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import { avecNomsHarmonises, sansDoublonsDOffice } from '@/features/stock/utils/doublonsListes';
import { avecListesDOffice } from '@/features/stock/services/denrees';
import { avecRemisesAZero, estRemiseAZero } from '@/features/stock/services/remisesAZero';
import type { PieceJointe } from '@/features/fichiers/types';
import type { ArchiveStock, ReglageCategorie } from '@/features/stock/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import { generateId } from '@/shared/utils/id';
import { todayISO } from '@/shared/utils/dates';

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
function dossiersSavonsValides(dossiers: ArchiveStock['dossiersSavons']): ArchiveStock['dossiersSavons'] {
  const valides: NonNullable<ArchiveStock['dossiersSavons']> = {};
  for (const [article, d] of Object.entries(dossiers ?? {})) {
    if (d && typeof d === 'object' && d.etapes && typeof d.etapes === 'object') valides[article] = d;
  }
  return valides;
}

function platsValides(plats: ArchiveStock['platsFabriques']): ArchiveStock['platsFabriques'] {
  const valides: NonNullable<ArchiveStock['platsFabriques']> = {};
  for (const [id, p] of Object.entries(plats ?? {})) {
    if (p && Array.isArray(p.ingredients)) valides[id] = p;
  }
  return valides;
}

/** Les mouvements automatiques désactivés lus : ceux qui ont une date bien formée (rien : tout est actif). */
function automatiquesValides(brut: ArchiveStock['sansAutomatique']): ArchiveStock['sansAutomatique'] {
  const sans: NonNullable<ArchiveStock['sansAutomatique']> = {};
  const date = (valeur: unknown): valeur is string => typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valeur);
  if (date(brut?.lait)) sans.lait = brut.lait;
  if (date(brut?.aliments)) sans.aliments = brut.aliments;
  return Object.keys(sans).length > 0 ? sans : undefined;
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
  const prixVif: Record<string, number> = {};
  for (const [cle, montant] of Object.entries(archive?.prixVif ?? {})) {
    if (typeof montant === 'number' && montant > 0) prixVif[cle] = montant;
  }
  const litresParFromage: Record<string, number> = {};
  for (const [cle, litres] of Object.entries(archive?.litresParFromage ?? {})) {
    if (typeof litres === 'number' && litres > 0) litresParFromage[cle] = litres;
  }
  const dureeDeVie: Record<string, number> = {};
  for (const [cle, jours] of Object.entries(archive?.dureeDeVie ?? {})) {
    if (typeof jours === 'number' && jours > 0) dureeDeVie[cle] = Math.round(jours);
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
    prixVif,
    litresParFromage,
    dureeDeVie,
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
    sansAutomatique: automatiquesValides(archive?.sansAutomatique),
    etiquettesImprimees: Array.isArray(archive?.etiquettesImprimees)
      ? archive.etiquettesImprimees.filter(
          (e) => e && typeof e.id === 'string' && typeof e.lotId === 'string' && typeof e.nombre === 'number',
        )
      : undefined,
    masques: Array.isArray(archive?.masques) ? archive.masques.filter((cle) => typeof cle === 'string') : [],
    sectionsMasquees: sectionsMasqueesValides(archive?.sectionsMasquees),
    denreesAjoutees: archive?.denreesAjoutees === true ? true : undefined,
    matieresSavonAjoutees: archive?.matieresSavonAjoutees === true ? true : undefined,
    dossiersSavons: dossiersSavonsValides(archive?.dossiersSavons),
    recettes: Array.isArray(archive?.recettes)
      ? archive.recettes.filter(
          (r) => r && typeof r.id === 'string' && typeof r.nom === 'string' && Array.isArray(r.ingredients),
        )
      : [],
  };
}

/** Le stock de l'établissement actif (vide s'il n'y a encore rien), avec la remise à zéro des aliments à chaque nouvel achat. */
export async function lireArchiveStock(): Promise<ArchiveStock> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return avecNomsHarmonises(avecListesDOffice({ ...VIDE }));
  try {
    const archive = avecNomsHarmonises(sansDoublonsDOffice(avecListesDOffice(normaliserArchiveStock(JSON.parse(raw)))));
    // La remise à zéro des aliments s'arrête à la date où elle a été désactivée : celles d'avant restent.
    return { ...archive, mouvements: avecRemisesAZero(archive.mouvements, archive.sansAutomatique?.aliments) };
  } catch {
    return avecNomsHarmonises(avecListesDOffice({ ...VIDE }));
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

/**
 * Active ou désactive un mouvement automatique du stock : la balance du lait, ou la remise à zéro des aliments à chaque achat. Désactivé, il ne se
 * fait plus à partir d'aujourd'hui ; ce qu'il avait fait avant reste.
 */
export async function reglerMouvementAutomatique(nom: 'lait' | 'aliments', actif: boolean): Promise<void> {
  const raw = await AsyncStorage.getItem(cle());
  let archive: ArchiveStock;
  try {
    archive = normaliserArchiveStock(raw ? JSON.parse(raw) : undefined);
  } catch {
    archive = normaliserArchiveStock(undefined);
  }
  const sans = { ...archive.sansAutomatique, [nom]: actif ? undefined : todayISO() };
  await remplacerArchiveStock({ ...archive, sansAutomatique: automatiquesValides(sans) });
}

/** Note une impression d'étiquettes (les 50 dernières sont gardées) : de quoi les réimprimer plus tard. */
export async function noterEtiquettesImprimees(impression: { lotId: string; nombre: number; date?: string }): Promise<void> {
  const raw = await AsyncStorage.getItem(cle());
  let archive: ArchiveStock;
  try {
    archive = normaliserArchiveStock(raw ? JSON.parse(raw) : undefined);
  } catch {
    archive = normaliserArchiveStock(undefined);
  }
  const nouvelle = { id: generateId(), lotId: impression.lotId, nombre: impression.nombre, date: impression.date ?? todayISO() };
  await remplacerArchiveStock({ ...archive, etiquettesImprimees: [...(archive.etiquettesImprimees ?? []), nouvelle].slice(-50) });
}
