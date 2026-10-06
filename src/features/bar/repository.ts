import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage } from '@/features/etablissements/repository';
import type { Aliment, ArchiveBar, ArticleGite, Boisson, TicketBar } from '@/features/bar/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.BAR);

/** Remet une archive lue (ou reçue d'une sauvegarde) dans sa forme : rien ne manque. */
export function normaliserArchiveBar(archive: Partial<ArchiveBar> | undefined): ArchiveBar {
  const ordres: Record<string, string[]> = {};
  for (const [onglet, ids] of Object.entries(archive?.ordres ?? {})) {
    if (Array.isArray(ids)) ordres[onglet] = ids;
  }
  // Avant la fusion des boissons et de la nourriture en « consommables », chacune avait son ordre.
  if (!ordres.consommables) ordres.consommables = [...(ordres.boissons ?? []), ...(ordres.aliments ?? [])];
  return {
    boissons: Array.isArray(archive?.boissons) ? archive.boissons : [],
    aliments: Array.isArray(archive?.aliments) ? archive.aliments : [],
    articles: Array.isArray(archive?.articles) ? archive.articles : [],
    tickets: Array.isArray(archive?.tickets) ? archive.tickets : [],
    ordres,
  };
}

/** Les boissons et les aliments de l'établissement actif (rien s'il n'y en a pas encore). */
export async function lireArchiveBar(): Promise<ArchiveBar> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return normaliserArchiveBar(undefined);
  try {
    return normaliserArchiveBar(JSON.parse(raw));
  } catch {
    return normaliserArchiveBar(undefined);
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveBar(archive: ArchiveBar): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
}

const parNom = <T extends { nom: string }>(a: T, b: T) => a.nom.localeCompare(b.nom);

/** Les éléments d'une liste dans l'ordre choisi ; ceux que l'ordre ne cite pas suivent, dans l'ordre où ils sont. */
export function triesSelonOrdre<T extends { id: string }>(elements: T[], ordre: string[]): T[] {
  const rang = (e: T) => {
    const i = ordre.indexOf(e.id);
    return i >= 0 ? i : ordre.length + elements.indexOf(e);
  };
  return [...elements].sort((a, b) => rang(a) - rang(b));
}

/** Un consommable du stock : une boisson ou un aliment, avec son identifiant. */
export interface Consommable {
  genre: 'boisson' | 'aliment';
  id: string;
}

/** Les consommables (boissons et aliments mêlés) dans l'ordre choisi ; ceux que l'ordre ne cite pas suivent. */
export function consommablesTries(archive: ArchiveBar): Consommable[] {
  const tous: Consommable[] = [
    ...archive.boissons.map((b) => ({ genre: 'boisson' as const, id: b.id })),
    ...archive.aliments.map((a) => ({ genre: 'aliment' as const, id: a.id })),
  ];
  return triesSelonOrdre(tous, archive.ordres.consommables ?? []);
}

/** Les identifiants des articles d'une étiquette du stock (« consommables », « materiel »…), dans l'ordre choisi. */
function idsDeLOnglet(archive: ArchiveBar, onglet: string): string[] {
  if (onglet === 'consommables') return consommablesTries(archive).map((c) => c.id);
  return triesSelonOrdre(
    archive.articles.filter((a) => a.categorie === onglet),
    archive.ordres[onglet] ?? [],
  ).map((a) => a.id);
}

/** Place un article à un index précis de l'étiquette du stock où on l'a glissé. */
export async function positionnerDansLeStock(
  onglet: string,
  id: string,
  nouvelIndex: number,
  /** La liste affichée (filtrée par activité) dans laquelle on a glissé la ligne : ses identifiants, dans l'ordre affiché. */
  affichees?: string[],
): Promise<void> {
  const archive = await lireArchiveBar();
  const plein = idsDeLOnglet(archive, onglet);
  const liste = [...(affichees ?? plein)];
  const index = liste.indexOf(id);
  if (index < 0 || nouvelIndex < 0 || nouvelIndex >= liste.length) return;
  liste.splice(nouvelIndex, 0, ...liste.splice(index, 1));
  // Les lignes affichées reprennent, dans leur nouvel ordre, les places qu'elles occupaient dans la liste complète.
  const places = plein.map((c, i) => (liste.includes(c) ? i : -1)).filter((i) => i >= 0);
  const ids = [...plein];
  places.forEach((place, rang) => (ids[place] = liste[rang]));
  await remplacerArchiveBar({ ...archive, ordres: { ...archive.ordres, [onglet]: ids } });
}

/** Ajoute du matériel, un conditionnement ou un produit d'entretien au stock avec le nom choisi. */
export async function ajouterArticleGite(
  categorie: ArticleGite['categorie'],
  nom: string,
  rubrique?: ArticleGite['rubrique'],
): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({
    ...archive,
    articles: [...archive.articles, { id: generateId(), nom: nom.trim(), stock: 0, categorie, rubrique }],
  });
}

/** Change le nom d'un article (matériel, conditionnement, entretien) et son activité ; son stock est conservé. */
export async function renommerArticleGite(
  id: string,
  nom: string,
  rubrique?: ArticleGite['rubrique'],
): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({
    ...archive,
    articles: archive.articles.map((a) => (a.id === id ? { ...a, nom: nom.trim(), rubrique } : a)),
  });
}

export async function supprimerArticleGite(id: string): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({ ...archive, articles: archive.articles.filter((a) => a.id !== id) });
}

/** Remplace les tickets en cours (les boissons et aliments ne bougent pas). */
export async function remplacerTickets(tickets: TicketBar[]): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({ ...archive, tickets });
}

/** Les boissons dans l'ordre alphabétique. */
export async function listBoissons(): Promise<Boisson[]> {
  return [...(await lireArchiveBar()).boissons].sort(parNom);
}

/** Les aliments dans l'ordre alphabétique. */
export async function listAliments(): Promise<Aliment[]> {
  return [...(await lireArchiveBar()).aliments].sort(parNom);
}

/** Crée la boisson (sans identifiant) ou met à jour celle qui en a un (son stock est conservé). */
export async function enregistrerBoisson(boisson: Omit<Boisson, 'id'> & { id?: string }): Promise<Boisson> {
  const archive = await lireArchiveBar();
  const i = archive.boissons.findIndex((b) => b.id === boisson.id);
  const complete: Boisson = {
    ...(i >= 0 ? archive.boissons[i] : {}),
    ...boisson,
    id: boisson.id ?? generateId(),
  };
  if (i >= 0) archive.boissons[i] = complete;
  else archive.boissons.push(complete);
  await remplacerArchiveBar(archive);
  return complete;
}

export async function supprimerBoisson(id: string): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({ ...archive, boissons: archive.boissons.filter((b) => b.id !== id) });
}

/** Ajoute un aliment au stock avec le nom choisi. */
export async function ajouterAliment(nom: string, rubrique?: Aliment['rubrique']): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({
    ...archive,
    aliments: [...archive.aliments, { id: generateId(), nom: nom.trim(), stock: 0, rubrique }],
  });
}

/** Change le nom d'un aliment, et l'activité pour laquelle il est tenu (son stock est conservé). */
export async function renommerAliment(
  id: string,
  nom: string,
  rubrique?: Aliment['rubrique'],
): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({
    ...archive,
    aliments: archive.aliments.map((a) => (a.id === id ? { ...a, nom: nom.trim(), rubrique } : a)),
  });
}

export async function supprimerAliment(id: string): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({ ...archive, aliments: archive.aliments.filter((a) => a.id !== id) });
}

/** Ajoute (positif) ou retire (négatif) des unités au stock d'une boisson, d'un aliment ou d'un autre article. */
export async function ajusterStock(
  genre: 'boisson' | 'aliment' | 'article',
  id: string,
  delta: number,
): Promise<void> {
  const archive = await lireArchiveBar();
  if (genre === 'boisson') {
    archive.boissons = archive.boissons.map((b) =>
      b.id === id ? { ...b, stock: (b.stock ?? 0) + delta } : b,
    );
  } else if (genre === 'aliment') {
    archive.aliments = archive.aliments.map((a) => (a.id === id ? { ...a, stock: a.stock + delta } : a));
  } else {
    archive.articles = archive.articles.map((a) => (a.id === id ? { ...a, stock: a.stock + delta } : a));
  }
  await remplacerArchiveBar(archive);
}
