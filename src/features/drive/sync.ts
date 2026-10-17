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
  appliquerProfilEtablissementActif,
  profilEstVide,
  profilEtablissementActif,
} from '@/features/etablissements/repository';
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
  upsertFileText,
  downloadFileText,
} from '@/features/drive/driveApi';
import { toutesLesPieces } from '@/features/fichiers/services/inventaire';
import {
  ecrirePieceBase64,
  lirePieceBase64,
  pieceExiste,
  piecesDisponibles,
} from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { empreinteTexte } from '@/shared/utils/empreinte';
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
  await tirerDossiers(accessToken, folderId);
  await tirerGite(accessToken, folderId);
  await tirerTrading(accessToken, folderId);
  await tirerBar(accessToken, folderId);
  await tirerCommercial(accessToken, folderId);
  await tirerBibliotheque(accessToken, folderId);
  await tirerStock(accessToken, folderId);
  await tirerAnnexes(accessToken, folderId);
  await tirerPieces(accessToken, folderId);
  await tirerComptesPcg(accessToken, folderId);
  // Les animaux ont pu changer : les poses de l'inventaire des boucles (dates comprises) se refont d'après eux.
  await synchroniserPoseBoucles();
  return bilan;
}
