
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import type { ArchiveDossiers } from '@/features/dossiers/types';
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

/** Supprime tout ce qui concerne un client (quand sa fiche est supprimée). */
export async function supprimerDossiersDuClient(clientId: string): Promise<void> {
  const archive = await lireArchiveDossiers();
  await remplacerArchiveDossiers({
    sousDossiers: archive.sousDossiers.filter((d) => d.clientId !== clientId),
    elements: archive.elements.filter((e) => e.clientId !== clientId),
  });
}
