import AsyncStorage from '@react-native-async-storage/async-storage';
import { appliquerEspece, estEspeceOffice, retirerEspece } from '@/features/especes/services/registre';
import type { ArchiveEspeces, DefinitionEspece } from '@/features/especes/types';
import { CLE_STOCKAGE, PREFIXE_STOCKAGE } from '@/shared/constants/stockage';

const CLE = `${PREFIXE_STOCKAGE}${CLE_STOCKAGE.ESPECES}`;

export async function lireArchiveEspeces(): Promise<ArchiveEspeces> {
  return lire();
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveEspeces(archive: ArchiveEspeces): Promise<void> {
  const avant = await lire();
  const nouvelle: ArchiveEspeces = {
    ajoutees: Array.isArray(archive.ajoutees) ? archive.ajoutees : [],
    modifiees: archive.modifiees && typeof archive.modifiees === 'object' ? archive.modifiees : {},
  };
  await AsyncStorage.setItem(CLE, JSON.stringify(nouvelle));
  // Les espèces qui ne sont plus dans la sauvegarde quittent les dictionnaires, les autres s'y mettent à jour.
  for (const ancienne of avant.ajoutees) {
    if (!nouvelle.ajoutees.some((e) => e.id === ancienne.id)) retirerEspece(ancienne.id);
  }
  for (const definition of Object.values(nouvelle.modifiees)) appliquerEspece(definition);
  for (const definition of nouvelle.ajoutees) appliquerEspece(definition);
}

async function lire(): Promise<ArchiveEspeces> {
  const raw = await AsyncStorage.getItem(CLE);
  try {
    const lu = raw ? (JSON.parse(raw) as Partial<ArchiveEspeces>) : {};
    return {
      ajoutees: Array.isArray(lu.ajoutees) ? lu.ajoutees : [],
      modifiees: lu.modifiees && typeof lu.modifiees === 'object' ? lu.modifiees : {},
    };
  } catch {
    return { ajoutees: [], modifiees: {} };
  }
}

/** À appeler au démarrage, avant toute lecture d'un établissement : met les espèces ajoutées et modifiées dans les dictionnaires. */
export async function chargerEspeces(): Promise<ArchiveEspeces> {
  const archive = await lire();
  for (const definition of Object.values(archive.modifiees)) appliquerEspece(definition);
  for (const definition of archive.ajoutees) appliquerEspece(definition);
  return archive;
}

/** Enregistre une espèce (ajoutée, ou d'office dont on change les noms et les âges) et l'applique aussitôt. */
export async function enregistrerEspece(definition: DefinitionEspece): Promise<void> {
  const archive = await lire();
  if (estEspeceOffice(definition.id)) {
    archive.modifiees = { ...archive.modifiees, [definition.id]: definition };
  } else {
    archive.ajoutees = [...archive.ajoutees.filter((e) => e.id !== definition.id), definition];
  }
  await AsyncStorage.setItem(CLE, JSON.stringify(archive));
  appliquerEspece(definition);
}

/** Supprime une espèce ajoutée (celles d'office ne se suppriment pas). */
export async function supprimerEspece(id: string): Promise<void> {
  if (estEspeceOffice(id)) return;
  const archive = await lire();
  archive.ajoutees = archive.ajoutees.filter((e) => e.id !== id);
  await AsyncStorage.setItem(CLE, JSON.stringify(archive));
  retirerEspece(id);
}
