import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { CATEGORIES } from '@/storage/csv';
import { getYears, loadYear, saveYear, reindexYear } from '@/storage/localStore';
import { getSettings, updateSettings, type InfosExploitation } from '@/storage/settings';
import { listFournisseurs, remplacerTousFournisseurs } from '@/storage/fournisseurs';
import type { Categorie, Fournisseur, RecordMap } from '@/types/models';

const VERSION_SAUVEGARDE = 1;

interface FichierSauvegarde {
  version: number;
  exporteLe: string;
  donnees: Partial<Record<Categorie, Record<string, unknown[]>>>;
  fournisseurs: Fournisseur[];
  exploitation?: InfosExploitation;
}

/**
 * Sauvegarde locale complète (toutes années, toutes catégories, fournisseurs, informations
 * d'exploitation) en un seul fichier JSON, à conserver hors de l'appareil (mail, stockage,
 * autre appli) — sert à tout restaurer après une réinstallation, indépendamment de Google Drive.
 */
export async function exporterSauvegardeLocale(): Promise<void> {
  const donnees: Partial<Record<Categorie, Record<string, unknown[]>>> = {};
  for (const categorie of CATEGORIES) {
    const annees = await getYears(categorie);
    const parAnnee: Record<string, unknown[]> = {};
    for (const annee of annees) {
      parAnnee[String(annee)] = await loadYear(categorie, annee);
    }
    donnees[categorie] = parAnnee;
  }

  const [fournisseurs, settings] = await Promise.all([listFournisseurs(), getSettings()]);

  const sauvegarde: FichierSauvegarde = {
    version: VERSION_SAUVEGARDE,
    exporteLe: new Date().toISOString(),
    donnees,
    fournisseurs,
    exploitation: settings.exploitation,
  };

  const nomFichier = `troupeau_chevres_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
  const destination = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.writeAsStringAsync(destination, JSON.stringify(sauvegarde), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(destination, {
      mimeType: 'application/json',
      dialogTitle: 'Sauvegarde Troupeau Chèvres',
    });
  }
}

export interface ResultatImport {
  /** L'utilisateur a annulé la sélection du fichier. */
  annule: boolean;
  animaux: number;
  fournisseurs: number;
}

/**
 * Restaure une sauvegarde locale précédemment exportée : remplace intégralement les données
 * actuelles (toutes années, toutes catégories, fournisseurs, informations d'exploitation) par
 * celles du fichier choisi — pensé pour une réinstallation, pas pour une fusion avec l'existant.
 */
export async function importerSauvegardeLocale(): Promise<ResultatImport> {
  const choix = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (choix.canceled) return { annule: true, animaux: 0, fournisseurs: 0 };

  const contenu = await FileSystem.readAsStringAsync(choix.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let sauvegarde: FichierSauvegarde;
  try {
    sauvegarde = JSON.parse(contenu);
  } catch {
    throw new Error('Ce fichier n’est pas une sauvegarde Troupeau Chèvres valide (JSON illisible).');
  }
  if (!sauvegarde || typeof sauvegarde !== 'object' || !sauvegarde.donnees) {
    throw new Error('Ce fichier n’est pas une sauvegarde Troupeau Chèvres valide.');
  }

  let animaux = 0;
  for (const categorie of CATEGORIES) {
    const parAnnee = sauvegarde.donnees[categorie];
    if (!parAnnee) continue;
    for (const [anneeTexte, items] of Object.entries(parAnnee)) {
      const annee = Number(anneeTexte);
      if (!Number.isFinite(annee)) continue;
      const types = items as (RecordMap[typeof categorie] & { id: string })[];
      await saveYear(categorie, annee, types);
      await reindexYear(categorie, annee, types);
      if (categorie === 'cheptel') animaux += types.length;
    }
  }

  if (Array.isArray(sauvegarde.fournisseurs)) {
    await remplacerTousFournisseurs(sauvegarde.fournisseurs);
  }

  if (sauvegarde.exploitation) {
    await updateSettings({ exploitation: sauvegarde.exploitation });
  }

  return { annule: false, animaux, fournisseurs: sauvegarde.fournisseurs?.length ?? 0 };
}
