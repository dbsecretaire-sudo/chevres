import { supprimerPiece } from '@/features/fichiers/services/pieces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage } from '@/features/etablissements/repository';
import { dossiersDuSousArbre } from '@/features/dossiers/services/arborescence';
import type { ArchiveDossiers, Element, SousDossier } from '@/features/dossiers/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.DOSSIERS);

/** Sous-dossiers et contenus de l'établissement actif (vide s'il n'y en a pas encore). */
export async function lireArchiveDossiers(): Promise<ArchiveDossiers> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return { sousDossiers: [], elements: [] };
  try {
    const archive = JSON.parse(raw) as Partial<ArchiveDossiers>;
    return {
      sousDossiers: Array.isArray(archive.sousDossiers) ? archive.sousDossiers : [],
      elements: Array.isArray(archive.elements) ? archive.elements : [],
    };
  } catch {
    return { sousDossiers: [], elements: [] };
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveDossiers(archive: ArchiveDossiers): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
}

// --- Sous-dossiers ---

export async function getSousDossier(id: string): Promise<SousDossier | undefined> {
  return (await lireArchiveDossiers()).sousDossiers.find((d) => d.id === id);
}

/** Crée un dossier dans le dossier d'un client, ou dans un autre dossier si `parentId` est donné. */
export async function creerSousDossier(
  clientId: string,
  nom: string,
  parentId?: string,
): Promise<SousDossier> {
  const archive = await lireArchiveDossiers();
  const dossier: SousDossier = { id: generateId(), clientId, nom: nom.trim(), parentId };
  archive.sousDossiers.push(dossier);
  await remplacerArchiveDossiers(archive);
  return dossier;
}

/** Crée d'un coup plusieurs sous-dossiers pour un client (la structure type). */
export async function creerSousDossiers(clientId: string, noms: string[]): Promise<void> {
  const archive = await lireArchiveDossiers();
  for (const nom of noms) archive.sousDossiers.push({ id: generateId(), clientId, nom: nom.trim() });
  await remplacerArchiveDossiers(archive);
}

export async function renommerSousDossier(id: string, nom: string): Promise<void> {
  const archive = await lireArchiveDossiers();
  const dossier = archive.sousDossiers.find((d) => d.id === id);
  if (!dossier) return;
  dossier.nom = nom.trim();
  await remplacerArchiveDossiers(archive);
}

/** Supprime le dossier et tout ce qu'il contient : ses dossiers, à n'importe quelle profondeur, et leurs contenus. */
export async function supprimerSousDossier(id: string): Promise<void> {
  const archive = await lireArchiveDossiers();
  const ids = dossiersDuSousArbre(archive.sousDossiers, id);
  for (const element of archive.elements.filter((e) => ids.has(e.dossierId))) {
    for (const piece of element.fichiers ?? []) await supprimerPiece(piece);
  }
  await remplacerArchiveDossiers({
    sousDossiers: archive.sousDossiers.filter((d) => !ids.has(d.id)),
    elements: archive.elements.filter((e) => !ids.has(e.dossierId)),
  });
}

/** Supprime tout ce qui concerne un client (quand sa fiche est supprimée). */
export async function supprimerDossiersDuClient(clientId: string): Promise<void> {
  const archive = await lireArchiveDossiers();
  await remplacerArchiveDossiers({
    sousDossiers: archive.sousDossiers.filter((d) => d.clientId !== clientId),
    elements: archive.elements.filter((e) => e.clientId !== clientId),
  });
}

// --- Contenus ---

export async function getElement(id: string): Promise<Element | undefined> {
  return (await lireArchiveDossiers()).elements.find((e) => e.id === id);
}

/** Crée le contenu (sans identifiant) ou met à jour celui qui en a un. */
export async function enregistrerElement(element: Omit<Element, 'id'> & { id?: string }): Promise<Element> {
  const archive = await lireArchiveDossiers();
  const complet: Element = { ...element, id: element.id ?? generateId() };
  const i = archive.elements.findIndex((e) => e.id === complet.id);
  if (i >= 0) archive.elements[i] = complet;
  else archive.elements.push(complet);
  await remplacerArchiveDossiers(archive);
  return complet;
}

export async function supprimerElement(id: string): Promise<void> {
  const archive = await lireArchiveDossiers();
  for (const piece of archive.elements.find((e) => e.id === id)?.fichiers ?? []) await supprimerPiece(piece);
  await remplacerArchiveDossiers({ ...archive, elements: archive.elements.filter((e) => e.id !== id) });
}
