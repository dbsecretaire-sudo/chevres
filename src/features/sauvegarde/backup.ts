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
import { lireArchiveGite, normaliserArchiveGite, remplacerArchiveGite } from '@/features/gite/repository';
import type { ArchiveGite } from '@/features/gite/types';
import { lireArchiveTrading, remplacerArchiveTrading } from '@/features/trading/repository';
import type { ArchiveTrading } from '@/features/trading/types';
import { lireArchiveBar, normaliserArchiveBar, remplacerArchiveBar } from '@/features/bar/repository';
import type { ArchiveBar } from '@/features/bar/types';
import {
  lireArchiveCommercial,
  normaliserArchiveCommercial,
  remplacerArchiveCommercial,
} from '@/features/commercial/repository';
import type { ArchiveCommercial } from '@/features/commercial/types';
import {
  lireArchiveAnnexes,
  normaliserArchiveAnnexes,
  remplacerArchiveAnnexes,
} from '@/features/annexes/repository';
import type { ArchiveAnnexes } from '@/features/annexes/types';
import { lireArchiveStock, normaliserArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { lireArchiveEspeces, remplacerArchiveEspeces } from '@/features/especes/repository';
import type { ArchiveEspeces } from '@/features/especes/types';
import { toutesLesPieces } from '@/features/fichiers/services/inventaire';
import {
  ecrirePieceBase64,
  lirePieceBase64,
  pieceExiste,
  piecesDisponibles,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
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

/** Un fichier joint dans la sauvegarde : sa fiche et son contenu en base64. */
interface PieceSauvegardee {
  piece: PieceJointe;
  base64: string;
}

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
  /** Trades du journal de trading (absent des anciennes sauvegardes). */
  trading?: ArchiveTrading;
  /** Boissons du bar (absent des anciennes sauvegardes). */
  bar?: ArchiveBar;
  /** Commandes des clients et tarifs par catégorie de client (absent des anciennes sauvegardes). */
  commercial?: ArchiveCommercial;
  /** Stock de la fromagerie (absent des anciennes sauvegardes). */
  stock?: ArchiveStock;
  /** Les activités annexes du gîte : catégories, articles, prix, stocks, tickets (absent des anciennes sauvegardes). */
  annexes?: ArchiveAnnexes;
  /** Fichiers joints des contenus et des trades (absent des anciennes sauvegardes). */
  pieces?: PieceSauvegardee[];
  comptesPcg?: CompteComptableEnregistre[];
  exploitation?: InfosExploitation;
  /** Espèces et activités de l'établissement (absent des anciennes sauvegardes). */
  etablissement?: ProfilEtablissement;
  /** Les espèces ajoutées ou modifiées, communes à tous les établissements (absent des anciennes sauvegardes). */
  especes?: ArchiveEspeces;
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

  const [
    fournisseurs,
    clients,
    dossiers,
    gite,
    trading,
    bar,
    commercial,
    stock,
    comptesPcg,
    settings,
    etablissement,
    especes,
    annexes,
  ] = await Promise.all([
    listFournisseurs(),
    listClients(),
    lireArchiveDossiers(),
    lireArchiveGite(),
    lireArchiveTrading(),
    lireArchiveBar(),
    lireArchiveCommercial(),
    lireArchiveStock(),
    listComptesPcg(),
    getSettings(),
    profilEtablissementActif(),
    lireArchiveEspeces(),
    lireArchiveAnnexes(),
  ]);

  const pieces: PieceSauvegardee[] = [];
  if (piecesDisponibles()) {
    for (const piece of await toutesLesPieces()) {
      if (await pieceExiste(piece)) pieces.push({ piece, base64: await lirePieceBase64(piece) });
    }
  }

  const sauvegarde: FichierSauvegarde = {
    version: VERSION_SAUVEGARDE,
    exporteLe: new Date().toISOString(),
    donnees,
    fournisseurs,
    clients,
    dossiers,
    gite,
    trading,
    bar,
    commercial,
    stock,
    pieces,
    comptesPcg,
    exploitation: settings.exploitation,
    etablissement,
    especes,
    annexes,
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
  /** Trades du journal de trading (activité financière). */
  trades: number;
  /** Jeux de données (années, listes, fichiers joints) réellement remplacés par ceux de la sauvegarde. */
  misAJour: number;
  /** Jeux de données déjà identiques à ceux de la sauvegarde, laissés tels quels. */
  inchanges: number;
}

/**
 * Lit le texte du fichier choisi. Sur Android, la copie dans le cache faite par le sélecteur est parfois illisible pour
 * `FileSystem` (fichier venant d'un service en ligne, droits du fournisseur) : on retente alors par une lecture directe de l'URI.
 */
async function lireFichierChoisi(uri: string): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch (erreur) {
    try {
      return await (await fetch(uri)).text();
    } catch {
      throw erreur;
    }
  }
}

/**
 * Restaure une sauvegarde locale précédemment exportée : remplace intégralement les données
 * actuelles (toutes années, toutes catégories, fournisseurs, informations d'exploitation) par
 * celles du fichier choisi — pensé pour une réinstallation, pas pour une fusion avec l'existant.
 */
export async function importerSauvegardeLocale(): Promise<ResultatImport> {
  // Tous les types sont proposés : selon l'application d'où vient le fichier (Drive, messagerie, gestionnaire de fichiers), un
  // .json est annoncé « application/octet-stream » et serait grisé avec un filtre strict.
  const choix = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (choix.canceled)
    return {
      annule: true,
      animaux: 0,
      fournisseurs: 0,
      clients: 0,
      comptesPcg: 0,
      contenus: 0,
      sejours: 0,
      trades: 0,
      misAJour: 0,
      inchanges: 0,
    };

  const contenu = await lireFichierChoisi(choix.assets[0].uri);

  let sauvegarde: FichierSauvegarde;
  try {
    sauvegarde = JSON.parse(contenu);
  } catch {
    throw new Error(TEXTES.sauvegarde.backup.ceFichierNEstPas);
  }
  if (!sauvegarde || typeof sauvegarde !== 'object' || !sauvegarde.donnees) {
    throw new Error(TEXTES.sauvegarde.backup.ceFichierNEstPasUne);
  }

  let misAJour = 0;
  let inchanges = 0;
  /** N'écrit que ce qui diffère de ce que l'appareil contient déjà : le reste est laissé tel quel. */
  const appliquerSiDifferent = async (actuel: unknown, nouveau: unknown, ecrire: () => Promise<void>) => {
    if (JSON.stringify(actuel) === JSON.stringify(nouveau)) {
      inchanges += 1;
      return;
    }
    await ecrire();
    misAJour += 1;
  };

  let animaux = 0;
  for (const categorie of CATEGORIES_STOCKAGE) {
    const parAnnee = sauvegarde.donnees[categorie];
    if (!parAnnee) continue;
    for (const [anneeTexte, items] of Object.entries(parAnnee)) {
      const annee = Number(anneeTexte);
      if (!Number.isFinite(annee)) continue;
      const types = items as (RecordMap[typeof categorie] & { id: string })[];
      await appliquerSiDifferent(await loadYear(categorie, annee), types, async () => {
        await saveYear(categorie, annee, types);
        await reindexYear(categorie, annee, types);
      });
      if (categorie === CATEGORIE_STOCKAGE.CHEPTEL) animaux += types.length;
    }
  }

  if (Array.isArray(sauvegarde.fournisseurs)) {
    await appliquerSiDifferent(await listFournisseurs(), sauvegarde.fournisseurs, () =>
      remplacerTousFournisseurs(sauvegarde.fournisseurs),
    );
  }

  if (Array.isArray(sauvegarde.clients)) {
    await appliquerSiDifferent(await listClients(), sauvegarde.clients, () =>
      remplacerTousClients(sauvegarde.clients!),
    );
  }

  if (sauvegarde.dossiers && Array.isArray(sauvegarde.dossiers.sousDossiers)) {
    const dossiers = {
      sousDossiers: sauvegarde.dossiers.sousDossiers,
      elements: Array.isArray(sauvegarde.dossiers.elements) ? sauvegarde.dossiers.elements : [],
    };
    await appliquerSiDifferent(await lireArchiveDossiers(), dossiers, () =>
      remplacerArchiveDossiers(dossiers),
    );
  }

  if (sauvegarde.gite && Array.isArray(sauvegarde.gite.sejours)) {
    const gite = normaliserArchiveGite(sauvegarde.gite);
    await appliquerSiDifferent(await lireArchiveGite(), gite, () => remplacerArchiveGite(gite));
  }

  if (sauvegarde.trading && Array.isArray(sauvegarde.trading.trades)) {
    const trading = { trades: sauvegarde.trading.trades };
    await appliquerSiDifferent(await lireArchiveTrading(), trading, () => remplacerArchiveTrading(trading));
  }

  if (sauvegarde.bar && Array.isArray(sauvegarde.bar.boissons)) {
    const bar = normaliserArchiveBar(sauvegarde.bar);
    await appliquerSiDifferent(await lireArchiveBar(), bar, () => remplacerArchiveBar(bar));
  }

  if (sauvegarde.commercial && Array.isArray(sauvegarde.commercial.commandes)) {
    const commercial = normaliserArchiveCommercial(sauvegarde.commercial);
    await appliquerSiDifferent(await lireArchiveCommercial(), commercial, () =>
      remplacerArchiveCommercial(commercial),
    );
  }

  if (sauvegarde.stock && Array.isArray(sauvegarde.stock.mouvements)) {
    const stock = normaliserArchiveStock(sauvegarde.stock);
    await appliquerSiDifferent(await lireArchiveStock(), stock, () => remplacerArchiveStock(stock));
  }

  if (sauvegarde.annexes && Array.isArray(sauvegarde.annexes.activites)) {
    const annexes = normaliserArchiveAnnexes(sauvegarde.annexes);
    await appliquerSiDifferent(await lireArchiveAnnexes(), annexes, () => remplacerArchiveAnnexes(annexes));
  }

  if (Array.isArray(sauvegarde.pieces) && piecesDisponibles()) {
    for (const { piece, base64 } of sauvegarde.pieces) {
      if (!piece || !base64) continue;
      // Un fichier joint ne change jamais : s'il est déjà là, on ne le réécrit pas.
      if (await pieceExiste(piece)) {
        inchanges += 1;
        continue;
      }
      await ecrirePieceBase64(piece, base64);
      misAJour += 1;
    }
  }

  if (Array.isArray(sauvegarde.comptesPcg)) {
    await appliquerSiDifferent(await listComptesPcg(), sauvegarde.comptesPcg, () =>
      remplacerTousComptesPcg(sauvegarde.comptesPcg!),
    );
  }

  if (sauvegarde.exploitation) {
    await appliquerSiDifferent((await getSettings()).exploitation, sauvegarde.exploitation, () =>
      updateSettings({ exploitation: sauvegarde.exploitation }).then(() => undefined),
    );
  }

  // Les espèces ajoutées ou modifiées d'abord : les types de l'établissement les citent.
  if (sauvegarde.especes && Array.isArray(sauvegarde.especes.ajoutees)) {
    await appliquerSiDifferent(await lireArchiveEspeces(), sauvegarde.especes, () =>
      remplacerArchiveEspeces(sauvegarde.especes!),
    );
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
    trades: sauvegarde.trading?.trades?.length ?? 0,
    misAJour,
    inchanges,
  };
}
