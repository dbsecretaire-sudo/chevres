import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { CATEGORIES_STOCKAGE } from '@/shared/constants/csv';
import { getYears, loadYear, saveYear, reindexYear } from '@/shared/storage/localStore';
import { getSettings, updateSettings, type InfosExploitation } from '@/features/settings/settings';
import { listFournisseurs, remplacerTousFournisseurs } from '@/features/fournisseurs/repository';
import { listClients, remplacerTousClients } from '@/features/clients/repository';
import { lireArchiveDossiers, remplacerArchiveDossiers } from '@/features/dossiers/repository';
import type { ArchiveDossiers } from '@/features/dossiers/types';
import { lireArchiveGite, remplacerArchiveGite } from '@/features/gite/repository';
import type { ArchiveGite } from '@/features/gite/types';
import {
  appliquerProfilEtablissementActif,
  profilEtablissementActif,
  type ProfilEtablissement,
} from '@/features/etablissements/repository';
import {
  listComptesPcg,
  remplacerTousComptesPcg,
  type CompteComptableEnregistre,
} from '@/features/comptes-pcg/repository';
import type { Categorie, RecordMap } from '@/shared/storage/types';
import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import {
  VERSION_SAUVEGARDE,
  EXTENSION_SAUVEGARDE,
  NOM_FICHIER_SAUVEGARDE,
  NOM_FICHIER_SAUVEGARDE_ENTREPRISE,
} from '@/shared/constants/export';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';

interface FichierSauvegarde {
  version: number;
  exporteLe: string;
  donnees: Partial<Record<Categorie, Record<string, unknown[]>>>;
  fournisseurs: Fournisseur[];
  clients?: Client[];
  /** Sous-dossiers et contenus de l'explorateur de dossiers (absent des anciennes sauvegardes). */
  dossiers?: ArchiveDossiers;
  /** Séjours du gîte (absent des anciennes sauvegardes). */
  gite?: ArchiveGite;
  comptesPcg?: CompteComptableEnregistre[];
  exploitation?: InfosExploitation;
  /** Espèces et activités de l'établissement (absent des anciennes sauvegardes). */
  etablissement?: ProfilEtablissement;
}

/**
 * Sauvegarde locale complète (toutes années, toutes catégories, fournisseurs, informations
 * d'exploitation) en un seul fichier JSON, à conserver hors de l'appareil (mail, stockage,
 * autre appli) — sert à tout restaurer après une réinstallation, indépendamment de Google Drive.
 */
export async function exporterSauvegardeLocale(): Promise<void> {
  const donnees: Partial<Record<Categorie, Record<string, unknown[]>>> = {};
  for (const categorie of CATEGORIES_STOCKAGE) {
    const annees = await getYears(categorie);
    const parAnnee: Record<string, unknown[]> = {};
    for (const annee of annees) {
      parAnnee[String(annee)] = await loadYear(categorie, annee);
    }
    donnees[categorie] = parAnnee;
  }

  const [fournisseurs, clients, dossiers, gite, comptesPcg, settings, etablissement] = await Promise.all([
    listFournisseurs(),
    listClients(),
    lireArchiveDossiers(),
    lireArchiveGite(),
    listComptesPcg(),
    getSettings(),
    profilEtablissementActif(),
  ]);

  const sauvegarde: FichierSauvegarde = {
    version: VERSION_SAUVEGARDE,
    exporteLe: new Date().toISOString(),
    donnees,
    fournisseurs,
    clients,
    dossiers,
    gite,
    comptesPcg,
    exploitation: settings.exploitation,
    etablissement,
  };

  const debutNom = modeEntreprise() ? NOM_FICHIER_SAUVEGARDE_ENTREPRISE : NOM_FICHIER_SAUVEGARDE;
  const nomFichier = `${debutNom}_${new Date().toISOString().slice(0, 10)}.${EXTENSION_SAUVEGARDE}`;
  const destination = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.writeAsStringAsync(destination, JSON.stringify(sauvegarde), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(destination, {
      mimeType: 'application/json',
      dialogTitle: TEXTES.sauvegarde.backup.sauvegardeTroupeauChevres,
    });
  }
}

export interface ResultatImport {
  /** L'utilisateur a annulé la sélection du fichier. */
  annule: boolean;
  animaux: number;
  fournisseurs: number;
  clients: number;
  comptesPcg: number;
  /** Contenus des dossiers des clients (mode entreprise). */
  contenus: number;
  /** Séjours du gîte (association). */
  sejours: number;
}

/**
 * Restaure une sauvegarde locale précédemment exportée : remplace intégralement les données
 * actuelles (toutes années, toutes catégories, fournisseurs, informations d'exploitation) par
 * celles du fichier choisi — pensé pour une réinstallation, pas pour une fusion avec l'existant.
 */
export async function importerSauvegardeLocale(): Promise<ResultatImport> {
  const choix = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (choix.canceled)
    return { annule: true, animaux: 0, fournisseurs: 0, clients: 0, comptesPcg: 0, contenus: 0, sejours: 0 };

  const contenu = await FileSystem.readAsStringAsync(choix.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let sauvegarde: FichierSauvegarde;
  try {
    sauvegarde = JSON.parse(contenu);
  } catch {
    throw new Error(TEXTES.sauvegarde.backup.ceFichierNEstPas);
  }
  if (!sauvegarde || typeof sauvegarde !== 'object' || !sauvegarde.donnees) {
    throw new Error(TEXTES.sauvegarde.backup.ceFichierNEstPasUne);
  }

  let animaux = 0;
  for (const categorie of CATEGORIES_STOCKAGE) {
    const parAnnee = sauvegarde.donnees[categorie];
    if (!parAnnee) continue;
    for (const [anneeTexte, items] of Object.entries(parAnnee)) {
      const annee = Number(anneeTexte);
      if (!Number.isFinite(annee)) continue;
      const types = items as (RecordMap[typeof categorie] & { id: string })[];
      await saveYear(categorie, annee, types);
      await reindexYear(categorie, annee, types);
      if (categorie === CATEGORIE_STOCKAGE.CHEPTEL) animaux += types.length;
    }
  }

  if (Array.isArray(sauvegarde.fournisseurs)) {
    await remplacerTousFournisseurs(sauvegarde.fournisseurs);
  }

  if (Array.isArray(sauvegarde.clients)) {
    await remplacerTousClients(sauvegarde.clients);
  }

  if (sauvegarde.dossiers && Array.isArray(sauvegarde.dossiers.sousDossiers)) {
    await remplacerArchiveDossiers({
      sousDossiers: sauvegarde.dossiers.sousDossiers,
      elements: Array.isArray(sauvegarde.dossiers.elements) ? sauvegarde.dossiers.elements : [],
    });
  }

  if (sauvegarde.gite && Array.isArray(sauvegarde.gite.sejours)) {
    await remplacerArchiveGite({ sejours: sauvegarde.gite.sejours });
  }

  if (Array.isArray(sauvegarde.comptesPcg)) {
    await remplacerTousComptesPcg(sauvegarde.comptesPcg);
  }

  if (sauvegarde.exploitation) {
    await updateSettings({ exploitation: sauvegarde.exploitation });
  }

  // Les espèces de l'établissement : sans elles, les animaux d'une autre espèce que les chèvres resteraient masqués.
  if (sauvegarde.etablissement) {
    await appliquerProfilEtablissementActif(sauvegarde.etablissement);
  }

  return {
    annule: false,
    animaux,
    fournisseurs: sauvegarde.fournisseurs?.length ?? 0,
    clients: sauvegarde.clients?.length ?? 0,
    comptesPcg: sauvegarde.comptesPcg?.length ?? 0,
    contenus: sauvegarde.dossiers?.elements?.length ?? 0,
    sejours: sauvegarde.gite?.sejours?.length ?? 0,
  };
}
