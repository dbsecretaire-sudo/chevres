import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage } from '@/features/etablissements/repository';
import type { Aliment, ArchiveBar, Boisson, TicketBar } from '@/features/bar/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.BAR);

/** Remet une archive lue (ou reçue d'une sauvegarde) dans sa forme : rien ne manque. */
export function normaliserArchiveBar(archive: Partial<ArchiveBar> | undefined): ArchiveBar {
  return {
    boissons: Array.isArray(archive?.boissons) ? archive.boissons : [],
    aliments: Array.isArray(archive?.aliments) ? archive.aliments : [],
    tickets: Array.isArray(archive?.tickets) ? archive.tickets : [],
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
export async function ajouterAliment(nom: string): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({
    ...archive,
    aliments: [...archive.aliments, { id: generateId(), nom: nom.trim(), stock: 0 }],
  });
}

/** Change le nom d'un aliment (son stock est conservé). */
export async function renommerAliment(id: string, nom: string): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({
    ...archive,
    aliments: archive.aliments.map((a) => (a.id === id ? { ...a, nom: nom.trim() } : a)),
  });
}

export async function supprimerAliment(id: string): Promise<void> {
  const archive = await lireArchiveBar();
  await remplacerArchiveBar({ ...archive, aliments: archive.aliments.filter((a) => a.id !== id) });
}

/** Ajoute (positif) ou retire (négatif) des unités au stock d'une boisson ou d'un aliment. */
export async function ajusterStock(genre: 'boisson' | 'aliment', id: string, delta: number): Promise<void> {
  const archive = await lireArchiveBar();
  if (genre === 'boisson') {
    archive.boissons = archive.boissons.map((b) =>
      b.id === id ? { ...b, stock: (b.stock ?? 0) + delta } : b,
    );
  } else {
    archive.aliments = archive.aliments.map((a) => (a.id === id ? { ...a, stock: a.stock + delta } : a));
  }
  await remplacerArchiveBar(archive);
}
