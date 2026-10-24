import {
  fileNameFor,
  fileNameForCategorie,
  fromCSV,
  fromCSVParAnnees,
  toCSV,
  toCSVParAnnees,
} from '@/shared/storage/csv';
import { CATEGORIES_STOCKAGE } from '@/shared/constants/csv';
import { getYears, loadYear, reindexYear, saveYear } from '@/shared/storage/localStore';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { getSettings, updateSettings } from '@/features/settings/settings';
import { listFournisseurs, remplacerTousFournisseurs } from '@/features/fournisseurs/repository';
import { listClients, remplacerTousClients } from '@/features/clients/repository';
import { lireArchiveDossiers, remplacerArchiveDossiers } from '@/features/dossiers/repository';
import { lireArchiveGite, normaliserArchiveGite, remplacerArchiveGite } from '@/features/gite/repository';
import { lireBibliotheque, normaliserBibliotheque, remplacerBibliotheque } from '@/features/bibliotheque/repository';
import { lireArchiveTrading, remplacerArchiveTrading } from '@/features/trading/repository';
import { synchroniserPoseBoucles } from '@/features/stock/services/boucles';
import { lireArchiveBar, normaliserArchiveBar, remplacerArchiveBar } from '@/features/bar/repository';
import {
  lireArchiveCommercial,
  normaliserArchiveCommercial,
  remplacerArchiveCommercial,
} from '@/features/commercial/repository';
import {
  lireArchiveAnnexes,
  normaliserArchiveAnnexes,
  remplacerArchiveAnnexes,
} from '@/features/annexes/repository';
import { lireArchiveStock, normaliserArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import {
  listDocumentsIdentification,
  remplacerTousDocumentsIdentification,
} from '@/features/identification/repository';
import {
  choixLu,
  enregistrerChoixPartenaires,
  lireChoixPartenaires,
} from '@/features/exploitation/repository/partenaires';
import {
  appliquerProfilEtablissementActif,
  choisirEtablissementActif,
  creerEtablissement,
  getIdEtablissementActif,
  listEtablissements,
  profilEstVide,
  profilEtablissementActif,
  type Etablissement,
} from '@/features/etablissements/repository';
import { ID_ETABLISSEMENT_DEFAUT } from '@/shared/constants/stockage';
import { listComptesPcg, remplacerTousComptesPcg } from '@/features/comptes-pcg/repository';
import { lireArchiveEspeces, remplacerArchiveEspeces } from '@/features/especes/repository';
import {
  createFileBase64,
  type DriveFile,
  downloadFileBase64,
  ensureFolder,
  findFile,
  findFolder,
  listFiles,
  listerDossiersRacine,
  upsertFileText,
  downloadFileText,
} from '@/features/drive/driveApi';
import { toutesLesPieces } from '@/features/fichiers/services/inventaire';
import { rafraichirImages } from '@/features/stock/hooks/useImageDeLArticle';
import {
  ecrirePieceBase64,
  lirePieceBase64,
  pieceExiste,
  piecesDisponibles,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { empreinteTexte } from '@/shared/utils/empreinte';
import { baseDeLAnnee, baseDuFichier, lireBase, noterBase } from '@/features/drive/baseDeSynchro';
import { fusionner, type RapportFusion } from '@/features/drive/fusion';
import type { Categorie } from '@/shared/storage/types';
import {
  DOSSIER_RACINE_DRIVE,
  FICHIER_ANNEXES,
  FICHIER_CLIENTS,
  FICHIER_COMPTES_PCG,
  FICHIER_DOSSIERS,
  FICHIER_ESPECES,
  FICHIER_ETABLISSEMENT,
  FICHIER_EXPLOITATION,
  FICHIER_FOURNISSEURS,
  FICHIER_GITE,
  FICHIER_IDENTIFICATION,
  FICHIER_PARTENAIRES,
  FICHIER_BAR,
  FICHIER_COMMERCIAL,
  FICHIER_BIBLIOTHEQUE,
  FICHIER_STOCK,
  FICHIER_TRADING,
  MOTIF_FICHIER_ANNEE,
} from '@/shared/constants/drive';
import { DOSSIER_PIECES_DRIVE, SEPARATEUR_NOM_PIECE } from '@/shared/constants/fichiers';

/** Ce qu'une synchronisation a vraiment fait : fichiers écrits, et fichiers déjà à jour laissés tels quels. */
export interface BilanSynchro {
  misAJour: number;
  inchanges: number;
}

let bilan: BilanSynchro = { misAJour: 0, inchanges: 0 };

/** Envoie le contenu seulement s'il diffère de celui de Drive. */
async function deposer(accessToken: string, nom: string, dossierId: string, contenu: string): Promise<void> {
  const resultat = await upsertFileText(accessToken, nom, dossierId, contenu);
  if (resultat.modifie) bilan.misAJour += 1;
  else bilan.inchanges += 1;
}

/** Vrai si le fichier de Drive a déjà exactement le contenu local : inutile de le télécharger. */
async function identique(fichier: DriveFile, contenuLocal: string): Promise<boolean> {
  const pareil = !!fichier.md5Checksum && fichier.md5Checksum === (await empreinteTexte(contenuLocal));
  if (pareil) bilan.inchanges += 1;
  else bilan.misAJour += 1;
  return pareil;
}

/** Un dossier Drive par établissement : l'établissement historique garde le nom d'origine. */
export function nomDossierDrive(nomEtablissement: string, estDefaut: boolean): string {
  return estDefaut ? DOSSIER_RACINE_DRIVE : `${DOSSIER_RACINE_DRIVE} — ${nomEtablissement}`;
}

/**
 * Fait une même opération pour chaque établissement : chacun a son dossier sur Drive (créé au besoin) et ses données. Avec `decouvrir`, les établissements dont le
 * dossier est sur Drive (créés depuis un autre appareil) mais pas ici sont d'abord créés. L'établissement ouvert au départ est rétabli à la fin.
 */
export async function pourChaqueEtablissement<T>(
  accessToken: string,
  action: (folderId: string, etablissement: Etablissement) => Promise<T>,
  decouvrir = false,
): Promise<T[]> {
  const depart = getIdEtablissementActif();
  const resultats: T[] = [];
  try {
    if (decouvrir) {
      const debut = `${DOSSIER_RACINE_DRIVE} — `;
      const connus = new Set((await listEtablissements()).map((e) => e.nom.trim().toLowerCase()));
      for (const dossier of await listerDossiersRacine(accessToken, debut)) {
        const nom = dossier.name.slice(debut.length).trim();
        if (nom && !connus.has(nom.toLowerCase())) {
          await creerEtablissement({ nom });
          connus.add(nom.toLowerCase());
        }
      }
    }
    for (const etablissement of await listEtablissements()) {
      await choisirEtablissementActif(etablissement.id);
      const nomDossier = nomDossierDrive(etablissement.nom, etablissement.id === ID_ETABLISSEMENT_DEFAUT);
      const folderId = await ensureRootFolder(accessToken, nomDossier);
      await updateSettings({ driveFolderId: folderId, driveFolderName: nomDossier });
      resultats.push(await action(folderId, etablissement));
    }
  } finally {
    await choisirEtablissementActif(depart);
  }
  return resultats;
}

/** Drive a-t-il, pour un établissement ou plus, des données (ou des établissements entiers) que cet appareil n'a pas ? */
export async function driveADesDonneesEnPlusPartout(accessToken: string): Promise<boolean> {
  const debut = `${DOSSIER_RACINE_DRIVE} — `;
  const connus = new Set((await listEtablissements()).map((e) => e.nom.trim().toLowerCase()));
  const dossiers = await listerDossiersRacine(accessToken, debut);
  if (dossiers.some((d) => !connus.has(d.name.slice(debut.length).trim().toLowerCase()))) return true;
  return (await pourChaqueEtablissement(accessToken, (folderId) => driveADesDonneesEnPlus(accessToken, folderId))).some(Boolean);
}

/** Additionne les bilans de plusieurs établissements. */
export const sommeDesBilans = <B extends BilanSynchro>(bilans: readonly B[]): BilanSynchro => ({
  misAJour: bilans.reduce((t, b) => t + b.misAJour, 0),
  inchanges: bilans.reduce((t, b) => t + b.inchanges, 0),
});

export async function ensureRootFolder(
  accessToken: string,
  nomDossier: string = DOSSIER_RACINE_DRIVE,
): Promise<string> {
  const folder = await ensureFolder(accessToken, nomDossier);
  return folder.id;
}

/** Envoie les informations de l'exploitation (écran Accueil) vers Google Drive. */
export async function pousserInfosExploitation(accessToken: string, folderId: string): Promise<void> {
  const settings = await getSettings();
  await deposer(accessToken, FICHIER_EXPLOITATION, folderId, JSON.stringify(settings.exploitation ?? {}));
}

/** Récupère les informations de l'exploitation depuis Google Drive, si présentes. */
export async function tirerInfosExploitation(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_EXPLOITATION, folderId);
  if (!file || (await identique(file, JSON.stringify((await getSettings()).exploitation ?? {})))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await updateSettings({ exploitation: JSON.parse(json) });
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les infos locales.
  }
}

/** Envoie les espèces et activités de l'établissement vers Google Drive. */
export async function pousserEtablissement(accessToken: string, folderId: string): Promise<void> {
  const profil = await profilEtablissementActif();
  // Un profil vide n'est pas envoyé : il écraserait les types renseignés depuis un autre appareil.
  if (profilEstVide(profil)) return;
  await deposer(accessToken, FICHIER_ETABLISSEMENT, folderId, JSON.stringify(profil));
}

/** Récupère les espèces et activités de l'établissement depuis Google Drive, si présentes (sans toucher à son nom). */
export async function tirerEtablissement(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_ETABLISSEMENT, folderId);
  if (!file) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await appliquerProfilEtablissementActif(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les types locaux.
  }
}

/** Envoie les espèces ajoutées ou modifiées vers Google Drive (elles valent pour tous les établissements). */
export async function pousserEspeces(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveEspeces();
  // Rien d'ajouté ni de modifié : rien à envoyer (cela n'écrase pas les espèces d'un autre appareil).
  if (archive.ajoutees.length === 0 && Object.keys(archive.modifiees).length === 0) return;
  await deposer(accessToken, FICHIER_ESPECES, folderId, JSON.stringify(archive));
}

/** Récupère les espèces depuis Google Drive, si elles sont présentes (à faire avant les types de l'établissement). */
export async function tirerEspeces(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_ESPECES, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveEspeces())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.ajoutees)) await remplacerArchiveEspeces(archive);
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les espèces locales.
  }
}

/** Envoie la liste des fournisseurs vers Google Drive. */
export async function pousserFournisseurs(accessToken: string, folderId: string): Promise<void> {
  const fournisseurs = await listFournisseurs();
  await deposer(accessToken, FICHIER_FOURNISSEURS, folderId, JSON.stringify(fournisseurs));
}

/** Récupère la liste des fournisseurs depuis Google Drive, si présente (remplace la liste locale). */
export async function tirerFournisseurs(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_FOURNISSEURS, folderId);
  if (!file || (await identique(file, JSON.stringify(await listFournisseurs())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await remplacerTousFournisseurs(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie la liste des clients vers Google Drive. */
export async function pousserClients(accessToken: string, folderId: string): Promise<void> {
  const clients = await listClients();
  await deposer(accessToken, FICHIER_CLIENTS, folderId, JSON.stringify(clients));
}

/** Récupère la liste des clients depuis Google Drive, si présente (remplace la liste locale). */
export async function tirerClients(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_CLIENTS, folderId);
  if (!file || (await identique(file, JSON.stringify(await listClients())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await remplacerTousClients(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie les sous-dossiers et contenus de l'explorateur de dossiers vers Google Drive. */
export async function pousserDossiers(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveDossiers();
  await deposer(accessToken, FICHIER_DOSSIERS, folderId, JSON.stringify(archive));
}

/** Récupère les sous-dossiers et contenus depuis Google Drive, s'ils sont présents (remplace les données locales). */
export async function tirerDossiers(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_DOSSIERS, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveDossiers())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.sousDossiers) && Array.isArray(archive?.elements)) {
      await remplacerArchiveDossiers(archive);
    }
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie les séjours du gîte vers Google Drive. */
export async function pousserGite(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveGite();
  await deposer(accessToken, FICHIER_GITE, folderId, JSON.stringify(archive));
}

/** Récupère les séjours du gîte depuis Google Drive, s'ils sont présents (remplace les données locales). */
export async function tirerGite(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_GITE, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveGite())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.sejours)) await remplacerArchiveGite(normaliserArchiveGite(archive));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie les commandes et les tarifs du volet commercial vers Google Drive. */
export async function pousserCommercial(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveCommercial();
  await deposer(accessToken, FICHIER_COMMERCIAL, folderId, JSON.stringify(archive));
}

/** Récupère les commandes et les tarifs depuis Google Drive, s'ils sont présents (remplace les données locales). */
export async function tirerCommercial(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_COMMERCIAL, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveCommercial())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.commandes))
      await remplacerArchiveCommercial(normaliserArchiveCommercial(archive));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie les documents d'identification et d'installation de l'exploitation vers Google Drive ; leurs fichiers partent avec les pièces jointes. */
export async function pousserIdentification(accessToken: string, folderId: string): Promise<void> {
  const documents = await listDocumentsIdentification();
  // Aucun document : rien à envoyer (cela n'écrase pas ceux d'un autre appareil).
  if (documents.length === 0) return;
  await deposer(accessToken, FICHIER_IDENTIFICATION, folderId, JSON.stringify(documents));
}

/** Récupère les documents d'identification depuis Google Drive, s'ils sont présents (ils remplacent les documents locaux). */
export async function tirerIdentification(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_IDENTIFICATION, folderId);
  if (!file || (await identique(file, JSON.stringify(await listDocumentsIdentification())))) return;
  try {
    const documents = JSON.parse(await downloadFileText(accessToken, file.id));
    if (Array.isArray(documents)) await remplacerTousDocumentsIdentification(documents);
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les documents locaux.
  }
}

/** Envoie le choix des partenaires (catégories de contacts ajoutées ou retirées, comme les laboratoires d'analyses) vers Google Drive. */
export async function pousserPartenaires(accessToken: string, folderId: string): Promise<void> {
  await deposer(accessToken, FICHIER_PARTENAIRES, folderId, JSON.stringify(await lireChoixPartenaires()));
}

/** Récupère le choix des partenaires depuis Google Drive, s'il est présent (il remplace le choix local). */
export async function tirerPartenaires(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_PARTENAIRES, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireChoixPartenaires())))) return;
  try {
    await enregistrerChoixPartenaires(choixLu(JSON.parse(await downloadFileText(accessToken, file.id))));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser le choix local.
  }
}

/** Envoie la liste des documents générés (la bibliothèque) vers Google Drive ; leurs fichiers partent avec les pièces jointes. */
export async function pousserBibliotheque(accessToken: string, folderId: string): Promise<void> {
  await deposer(accessToken, FICHIER_BIBLIOTHEQUE, folderId, JSON.stringify(await lireBibliotheque()));
}

/** Récupère la liste des documents générés depuis Google Drive (elle remplace la liste locale). */
export async function tirerBibliotheque(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_BIBLIOTHEQUE, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireBibliotheque())))) return;
  try {
    const liste = JSON.parse(await downloadFileText(accessToken, file.id));
    if (Array.isArray(liste)) await remplacerBibliotheque(normaliserBibliotheque(liste));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser la liste locale.
  }
}

/** Envoie la liste des boissons du bar vers Google Drive. */
export async function pousserBar(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveBar();
  await deposer(accessToken, FICHIER_BAR, folderId, JSON.stringify(archive));
}

/** Récupère la liste des boissons depuis Google Drive, si elle est présente (remplace les données locales). */
export async function tirerBar(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_BAR, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveBar())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.boissons)) await remplacerArchiveBar(normaliserArchiveBar(archive));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie le stock de la fromagerie vers Google Drive. */
export async function pousserStock(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveStock();
  await deposer(accessToken, FICHIER_STOCK, folderId, JSON.stringify(archive));
}

/** Récupère le stock de la fromagerie depuis Google Drive, s'il est présent (remplace les données locales). */
export async function tirerStock(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_STOCK, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveStock())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.mouvements)) await remplacerArchiveStock(normaliserArchiveStock(archive));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie les activités annexes du gîte (catégories, articles, prix, stocks, tickets) vers Google Drive. */
export async function pousserAnnexes(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveAnnexes();
  // Aucune activité : rien à envoyer (cela n'écrase pas celles d'un autre appareil).
  if (archive.activites.length === 0) return;
  await deposer(accessToken, FICHIER_ANNEXES, folderId, JSON.stringify(archive));
}

/** Récupère les activités annexes depuis Google Drive, si elles sont présentes (remplace les données locales). */
export async function tirerAnnexes(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_ANNEXES, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveAnnexes())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.activites)) await remplacerArchiveAnnexes(normaliserArchiveAnnexes(archive));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Envoie le journal de trading vers Google Drive. */
export async function pousserTrading(accessToken: string, folderId: string): Promise<void> {
  const archive = await lireArchiveTrading();
  await deposer(accessToken, FICHIER_TRADING, folderId, JSON.stringify(archive));
}

/** Récupère le journal de trading depuis Google Drive, s'il est présent (remplace les données locales). */
export async function tirerTrading(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_TRADING, folderId);
  if (!file || (await identique(file, JSON.stringify(await lireArchiveTrading())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    const archive = JSON.parse(json);
    if (Array.isArray(archive?.trades)) await remplacerArchiveTrading({ trades: archive.trades });
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/** Le nom d'un fichier joint sur Drive : son identifiant puis son nom d'origine (il ne change jamais). */
const nomPieceDrive = (piece: PieceJointe): string => `${piece.id}${SEPARATEUR_NOM_PIECE}${piece.nom}`;

/** Envoie les fichiers joints qui ne sont pas encore sur Drive (un fichier joint ne change jamais). */
export async function pousserPieces(accessToken: string, folderId: string): Promise<void> {
  if (!piecesDisponibles()) return;
  const pieces = await toutesLesPieces();
  if (pieces.length === 0) return;
  const dossier = await ensureFolder(accessToken, DOSSIER_PIECES_DRIVE, folderId);
  for (const piece of pieces) {
    if (!(await pieceExiste(piece))) continue;
    const nom = nomPieceDrive(piece);
    if (await findFile(accessToken, nom, dossier.id)) {
      bilan.inchanges += 1;
      continue;
    }
    await createFileBase64(accessToken, nom, dossier.id, piece.mime, await lirePieceBase64(piece));
    bilan.misAJour += 1;
  }
}

/** Récupère les fichiers joints qui manquent dans l'appareil (à appeler une fois les contenus et trades récupérés). */
export async function tirerPieces(accessToken: string, folderId: string): Promise<void> {
  if (!piecesDisponibles()) return;
  const manquantes: PieceJointe[] = [];
  for (const piece of await toutesLesPieces()) {
    if (!(await pieceExiste(piece))) manquantes.push(piece);
  }
  if (manquantes.length === 0) return;
  const dossier = await findFolder(accessToken, DOSSIER_PIECES_DRIVE, folderId);
  if (!dossier) return;
  for (const piece of manquantes) {
    const fichier = await findFile(accessToken, nomPieceDrive(piece), dossier.id);
    if (fichier) {
      await ecrirePieceBase64(piece, await downloadFileBase64(accessToken, fichier.id));
      bilan.misAJour += 1;
    }
  }
}

/** Envoie la liste des comptes PCG vers Google Drive. */
export async function pousserComptesPcg(accessToken: string, folderId: string): Promise<void> {
  const comptes = await listComptesPcg();
  await deposer(accessToken, FICHIER_COMPTES_PCG, folderId, JSON.stringify(comptes));
}

/** Récupère la liste des comptes PCG depuis Google Drive, si présente (remplace la liste locale). */
export async function tirerComptesPcg(accessToken: string, folderId: string): Promise<void> {
  const file = await findFile(accessToken, FICHIER_COMPTES_PCG, folderId);
  if (!file || (await identique(file, JSON.stringify(await listComptesPcg())))) return;
  const json = await downloadFileText(accessToken, file.id);
  try {
    await remplacerTousComptesPcg(JSON.parse(json));
  } catch {
    // Fichier distant vide ou corrompu — on ignore plutôt que d'écraser les données locales.
  }
}

/**
 * Envoie une catégorie (toutes ses années) dans un seul fichier de Google Drive (« cheptel.csv »), au lieu d'un fichier par année. Les anciens
 * fichiers par année ne sont pas touchés : ils restent sur Drive, on peut les effacer à la main.
 */
export async function pousserCategorie(accessToken: string, folderId: string, categorie: Categorie): Promise<void> {
  await deposer(accessToken, fileNameForCategorie(categorie), folderId, await csvLocalDeLaCategorie(categorie));
}

/** Le fichier de la catégorie tel que les données locales le donnent : toutes ses années, de la plus ancienne à la plus récente. */
async function csvLocalDeLaCategorie(categorie: Categorie): Promise<string> {
  const annees = [...(await getYears(categorie))].sort((a, b) => a - b);
  const parAnnee = await Promise.all(annees.map(async (annee) => ({ annee, items: await loadYear(categorie, annee) })));
  return toCSVParAnnees(
    categorie,
    parAnnee.filter((a) => a.items.length > 0),
  );
}

/**
 * Récupère une catégorie depuis son fichier unique de Google Drive : chaque année du fichier remplace l'année locale. Faux quand ce fichier
 * n'existe pas encore (Drive a l'ancienne forme, un fichier par année) : l'appelant relit alors les fichiers par année.
 */
export async function tirerCategorie(accessToken: string, folderId: string, categorie: Categorie): Promise<boolean> {
  const file = await findFile(accessToken, fileNameForCategorie(categorie), folderId);
  if (!file) return false;
  if (await identique(file, await csvLocalDeLaCategorie(categorie))) return true;
  const parAnnee = fromCSVParAnnees(categorie, await downloadFileText(accessToken, file.id));
  for (const [annee, items] of parAnnee) {
    await saveYear(categorie, annee, items as any);
    await reindexYear(categorie, annee, items as any);
  }
  return true;
}

/** Envoie les données locales de l'année vers Google Drive (écrase le fichier distant). */
export async function pousserAnnee(
  accessToken: string,
  folderId: string,
  annee: number,
  onProgress?: (categorie: Categorie) => void,
): Promise<void> {
  for (const categorie of CATEGORIES_STOCKAGE) {
    onProgress?.(categorie);
    const items = await loadYear(categorie, annee);
    const csv = toCSV(categorie, items);
    await deposer(accessToken, fileNameFor(categorie, annee), folderId, csv);
  }
}

/** Récupère les données de l'année depuis Google Drive (écrase les données locales). */
export async function tirerAnnee(
  accessToken: string,
  folderId: string,
  annee: number,
  onProgress?: (categorie: Categorie) => void,
  /** Seulement ces catégories (celles que Drive n'a pas encore en un fichier unique) ; toutes sinon. */
  categories: readonly Categorie[] = CATEGORIES_STOCKAGE,
): Promise<void> {
  for (const categorie of categories) {
    onProgress?.(categorie);
    const fileName = fileNameFor(categorie, annee);
    const file = await findFile(accessToken, fileName, folderId);
    if (!file || (await identique(file, toCSV(categorie, await loadYear(categorie, annee))))) continue;
    const csv = await downloadFileText(accessToken, file.id);
    const items = fromCSV(categorie, csv);
    await saveYear(categorie, annee, items as any);
    await reindexYear(categorie, annee, items as any);
  }
}

export async function pousserToutesAnnees(
  accessToken: string,
  folderId: string,
  onProgress?: (annee: number, categorie: Categorie) => void,
): Promise<BilanSynchro> {
  bilan = { misAJour: 0, inchanges: 0 };
  // Un fichier par catégorie (toutes les années dedans), au lieu d'un fichier par catégorie et par année.
  const anneeCourante = new Date().getFullYear();
  for (const categorie of CATEGORIES_STOCKAGE) {
    onProgress?.(anneeCourante, categorie);
    await pousserCategorie(accessToken, folderId, categorie);
  }
  await pousserInfosExploitation(accessToken, folderId);
  await pousserEspeces(accessToken, folderId);
  await pousserEtablissement(accessToken, folderId);
  await pousserFournisseurs(accessToken, folderId);
  await pousserClients(accessToken, folderId);
  await pousserIdentification(accessToken, folderId);
  await pousserPartenaires(accessToken, folderId);
  await pousserDossiers(accessToken, folderId);
  await pousserGite(accessToken, folderId);
  await pousserTrading(accessToken, folderId);
  await pousserBar(accessToken, folderId);
  await pousserCommercial(accessToken, folderId);
  await pousserBibliotheque(accessToken, folderId);
  await pousserStock(accessToken, folderId);
  await pousserAnnexes(accessToken, folderId);
  await pousserPieces(accessToken, folderId);
  await pousserComptesPcg(accessToken, folderId);
  await noterEtatSynchronise();
  return bilan;
}

/** Déduit les années présentes dans le dossier Drive à partir des noms de fichiers. */
export async function anneesDisponiblesSurDrive(accessToken: string, folderId: string): Promise<number[]> {
  const files = await listFiles(accessToken, folderId);
  const annees = new Set<number>();
  for (const f of files) {
    const match = f.name.match(MOTIF_FICHIER_ANNEE);
    if (match) annees.add(Number(match[1]));
  }
  return Array.from(annees).sort((a, b) => b - a);
}

/** Tire toutes les années connues localement, plus celles trouvées sur Drive (utile lors d'une première synchronisation sur un nouvel appareil). */
export async function tirerToutesAnnees(
  accessToken: string,
  folderId: string,
  onProgress?: (annee: number, categorie: Categorie) => void,
): Promise<BilanSynchro> {
  bilan = { misAJour: 0, inchanges: 0 };
  const [locales, distantes] = await Promise.all([
    toutesLesAnneesConnues(),
    anneesDisponiblesSurDrive(accessToken, folderId),
  ]);
  const annees = Array.from(new Set([...locales, ...distantes])).sort((a, b) => b - a);
  // Le fichier unique de chaque catégorie d'abord ; ce que Drive n'a pas encore sous cette forme se relit dans les anciens fichiers par année.
  const anciennes: Categorie[] = [];
  for (const categorie of CATEGORIES_STOCKAGE) {
    onProgress?.(annees[0] ?? new Date().getFullYear(), categorie);
    if (!(await tirerCategorie(accessToken, folderId, categorie))) anciennes.push(categorie);
  }
  if (anciennes.length > 0) {
    for (const annee of annees) {
      await tirerAnnee(accessToken, folderId, annee, (c) => onProgress?.(annee, c), anciennes);
    }
  }
  await tirerInfosExploitation(accessToken, folderId);
  await tirerEspeces(accessToken, folderId);
  await tirerEtablissement(accessToken, folderId);
  await tirerFournisseurs(accessToken, folderId);
  await tirerClients(accessToken, folderId);
  await tirerIdentification(accessToken, folderId);
  await tirerPartenaires(accessToken, folderId);
  await tirerDossiers(accessToken, folderId);
  await tirerGite(accessToken, folderId);
  await tirerTrading(accessToken, folderId);
  await tirerBar(accessToken, folderId);
  await tirerCommercial(accessToken, folderId);
  await tirerBibliotheque(accessToken, folderId);
  await tirerStock(accessToken, folderId);
  await tirerAnnexes(accessToken, folderId);
  await tirerPieces(accessToken, folderId);
  // Les images des cartes du stock viennent d'arriver : les cartes affichées les relisent.
  await rafraichirImages();
  await tirerComptesPcg(accessToken, folderId);
  // Les animaux ont pu changer : les poses de l'inventaire des boucles (dates comprises) se refont d'après eux.
  await synchroniserPoseBoucles();
  await noterEtatSynchronise();
  return bilan;
}

// ---------------------------------------------------------------------------------------------------------------------
// La fusion : deux appareils branchés sur le même Drive qui ont travaillé chacun de leur côté.
// ---------------------------------------------------------------------------------------------------------------------

/** Un fichier de données de Drive (JSON) : comment le lire ici, l'écrire ici, et quand il n'y a rien à envoyer. */
interface FichierFusionnable {
  fichier: string;
  lire: () => Promise<unknown>;
  ecrire: (valeur: any) => Promise<void>;
  /** Vrai : le contenu n'est qu'un décor vide, il ne s'envoie pas (il écraserait celui d'un autre appareil). */
  vide?: (valeur: any) => boolean;
}

const FICHIERS_FUSIONNABLES: readonly FichierFusionnable[] = [
  {
    fichier: FICHIER_EXPLOITATION,
    lire: async () => (await getSettings()).exploitation ?? {},
    ecrire: async (valeur) => void (await updateSettings({ exploitation: valeur })),
  },
  {
    fichier: FICHIER_ESPECES,
    lire: lireArchiveEspeces,
    ecrire: remplacerArchiveEspeces,
    vide: (a) => (a?.ajoutees?.length ?? 0) === 0 && Object.keys(a?.modifiees ?? {}).length === 0,
  },
  {
    fichier: FICHIER_ETABLISSEMENT,
    lire: profilEtablissementActif,
    ecrire: appliquerProfilEtablissementActif,
    vide: (p) => profilEstVide(p),
  },
  { fichier: FICHIER_FOURNISSEURS, lire: listFournisseurs, ecrire: remplacerTousFournisseurs },
  { fichier: FICHIER_CLIENTS, lire: listClients, ecrire: remplacerTousClients },
  {
    fichier: FICHIER_IDENTIFICATION,
    lire: listDocumentsIdentification,
    ecrire: remplacerTousDocumentsIdentification,
    vide: (d) => (d?.length ?? 0) === 0,
  },
  {
    fichier: FICHIER_PARTENAIRES,
    lire: lireChoixPartenaires,
    ecrire: (valeur) => enregistrerChoixPartenaires(choixLu(valeur)),
  },
  { fichier: FICHIER_DOSSIERS, lire: lireArchiveDossiers, ecrire: remplacerArchiveDossiers },
  { fichier: FICHIER_GITE, lire: lireArchiveGite, ecrire: (v) => remplacerArchiveGite(normaliserArchiveGite(v)) },
  { fichier: FICHIER_TRADING, lire: lireArchiveTrading, ecrire: (v) => remplacerArchiveTrading({ trades: v.trades ?? [] }) },
  { fichier: FICHIER_BAR, lire: lireArchiveBar, ecrire: (v) => remplacerArchiveBar(normaliserArchiveBar(v)) },
  { fichier: FICHIER_COMMERCIAL, lire: lireArchiveCommercial, ecrire: (v) => remplacerArchiveCommercial(normaliserArchiveCommercial(v)) },
  { fichier: FICHIER_BIBLIOTHEQUE, lire: lireBibliotheque, ecrire: (v) => remplacerBibliotheque(normaliserBibliotheque(v)) },
  { fichier: FICHIER_STOCK, lire: lireArchiveStock, ecrire: (v) => remplacerArchiveStock(normaliserArchiveStock(v)) },
  {
    fichier: FICHIER_ANNEXES,
    lire: lireArchiveAnnexes,
    ecrire: (v) => remplacerArchiveAnnexes(normaliserArchiveAnnexes(v)),
    vide: (a) => (a?.activites?.length ?? 0) === 0,
  },
  { fichier: FICHIER_COMPTES_PCG, lire: listComptesPcg, ecrire: remplacerTousComptesPcg },
];

/** Garde l'état de toutes les données (celui qui vient d'être envoyé ou récupéré) : à la prochaine fusion, ce qui n'y est plus a été supprimé. */
async function noterEtatSynchronise(): Promise<void> {
  for (const categorie of CATEGORIES_STOCKAGE) await noterEtatDeLaCategorie(categorie);
  for (const f of FICHIERS_FUSIONNABLES) {
    try {
      await noterBase(baseDuFichier(f.fichier), await f.lire());
    } catch {
      // Une donnée illisible n'a pas de base : sa prochaine fusion ne fait que réunir.
    }
  }
}

async function noterEtatDeLaCategorie(categorie: Categorie): Promise<void> {
  for (const annee of await getYears(categorie)) await noterBase(baseDeLAnnee(categorie, annee), await loadYear(categorie, annee));
}

/** Fusionne un fichier JSON : ce que Drive a de plus est ajouté ici, puis le tout est renvoyé sur Drive. */
async function fusionnerFichier(accessToken: string, folderId: string, f: FichierFusionnable, rapport: RapportFusion): Promise<void> {
  const local = await f.lire();
  const file = await findFile(accessToken, f.fichier, folderId);
  if (file) {
    try {
      const distant = JSON.parse(await downloadFileText(accessToken, file.id));
      const fusion = fusionner(local, distant, rapport, await lireBase(baseDuFichier(f.fichier)));
      if (JSON.stringify(fusion) !== JSON.stringify(local)) await f.ecrire(fusion);
    } catch {
      // Fichier distant vide ou corrompu : on garde les données locales et on les renvoie.
    }
  }
  const apres = await f.lire();
  if (f.vide?.(apres)) return;
  await deposer(accessToken, f.fichier, folderId, JSON.stringify(apres));
  await noterBase(baseDuFichier(f.fichier), apres);
}

/** Fusionne une catégorie annuelle (écritures, ventes, animaux, traitements…) : chaque année réunit les éléments des deux appareils, par identifiant. */
async function fusionnerCategorie(accessToken: string, folderId: string, categorie: Categorie, rapport: RapportFusion): Promise<void> {
  const file = await findFile(accessToken, fileNameForCategorie(categorie), folderId);
  if (file) {
    const parAnnee = fromCSVParAnnees(categorie, await downloadFileText(accessToken, file.id));
    for (const [annee, distants] of parAnnee) {
      const locaux = await loadYear(categorie, annee);
      const fusion = fusionner(locaux, distants, rapport, await lireBase(baseDeLAnnee(categorie, annee))) as unknown[];
      if (JSON.stringify(fusion) === JSON.stringify(locaux)) continue;
      await saveYear(categorie, annee, fusion as any);
      await reindexYear(categorie, annee, fusion as any);
    }
  }
  await pousserCategorie(accessToken, folderId, categorie);
  await noterEtatDeLaCategorie(categorie);
}

/**
 * Drive a-t-il des données que cet appareil n'a pas (un autre appareil a travaillé de son côté) ? Un essai à blanc de la fusion, sans rien écrire : l'envoi sur Drive
 * propose alors de fusionner d'abord, pour ne rien écraser.
 */
export async function driveADesDonneesEnPlus(accessToken: string, folderId: string): Promise<boolean> {
  const rapport: RapportFusion = { ajoutes: 0, conflits: 0 };
  for (const categorie of CATEGORIES_STOCKAGE) {
    const file = await findFile(accessToken, fileNameForCategorie(categorie), folderId);
    if (!file) continue;
    const parAnnee = fromCSVParAnnees(categorie, await downloadFileText(accessToken, file.id));
    for (const [annee, distants] of parAnnee) {
      fusionner(await loadYear(categorie, annee), distants, rapport, await lireBase(baseDeLAnnee(categorie, annee)));
      if (rapport.ajoutes > 0) return true;
    }
  }
  for (const f of FICHIERS_FUSIONNABLES) {
    const file = await findFile(accessToken, f.fichier, folderId);
    if (!file) continue;
    try {
      fusionner(await f.lire(), JSON.parse(await downloadFileText(accessToken, file.id)), rapport, await lireBase(baseDuFichier(f.fichier)));
    } catch {
      // Fichier distant vide ou corrompu : rien à fusionner.
    }
    if (rapport.ajoutes > 0) return true;
  }
  return false;
}

/**
 * Fusionne les données de cet appareil avec celles de Drive, quand un autre appareil a travaillé de son côté : tout ce que chacun a saisi est gardé (les écritures,
 * les animaux, le stock, les contacts, les réglages…), puis le résultat est envoyé sur Drive et les fichiers joints manquants se récupèrent. Sur une valeur différente
 * des deux côtés, celle de cet appareil reste. Une suppression se propage quand l'autre côté n'a pas touché à l'élément depuis la dernière synchronisation ; sinon l'élément modifié est gardé.
 */
export async function fusionnerAvecDrive(
  accessToken: string,
  folderId: string,
  onProgress?: (etape: string) => void,
): Promise<BilanSynchro & RapportFusion> {
  bilan = { misAJour: 0, inchanges: 0 };
  const rapport: RapportFusion = { ajoutes: 0, conflits: 0 };
  for (const categorie of CATEGORIES_STOCKAGE) {
    onProgress?.(categorie);
    await fusionnerCategorie(accessToken, folderId, categorie, rapport);
  }
  for (const f of FICHIERS_FUSIONNABLES) {
    onProgress?.(f.fichier.replace('.json', ''));
    await fusionnerFichier(accessToken, folderId, f, rapport);
  }
  onProgress?.('fichiers joints');
  await tirerPieces(accessToken, folderId);
  await pousserPieces(accessToken, folderId);
  await rafraichirImages();
  // Les animaux ont pu changer : les poses de l'inventaire des boucles (dates comprises) se refont d'après eux.
  await synchroniserPoseBoucles();
  return { ...bilan, ...rapport };
}
