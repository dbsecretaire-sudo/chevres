import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage } from '@/features/etablissements/repository';
import type { ArchiveGite, Chambre, Sejour } from '@/features/gite/types';
import { CHAMBRES_PAR_DEFAUT, COTE_CHAMBRE } from '@/shared/constants/gite';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import type { ValeurDe } from '@/shared/constants/valeurDe';

const cle = () => cleStockage(CLE_STOCKAGE.GITE);

type SejourBrut = Omit<Sejour, 'chambres'> & { chambres?: number[]; chambre?: number };

/**
 * Remet une archive lue (ou reçue d'une sauvegarde) dans sa forme : les séjours d'avant les réservations de plusieurs
 * chambres n'ont qu'une chambre, ceux d'avant la validation du paiement déjà en comptabilité sont comptés comme payés, et
 * un gîte sans chambres enregistrées a les six d'office.
 */
export function normaliserArchiveGite(
  archive: { sejours?: SejourBrut[]; chambres?: Chambre[] } | undefined,
): ArchiveGite {
  const sejours = (Array.isArray(archive?.sejours) ? archive.sejours : []).map(({ chambre, ...s }) => {
    const paye = s.paye ?? Boolean(s.factureId || s.factureRepasId);
    return {
      ...s,
      chambres: Array.isArray(s.chambres) ? s.chambres : [Number(chambre ?? 1)],
      paye,
      datePaiement: paye ? (s.datePaiement ?? s.arrivee) : undefined,
    };
  });
  const chambres =
    Array.isArray(archive?.chambres) && archive.chambres.length > 0 ? archive.chambres : CHAMBRES_PAR_DEFAUT;
  return { sejours, chambres };
}

/** Les séjours et les chambres de l'établissement actif (rien de plus que les six chambres s'il n'y a encore rien). */
export async function lireArchiveGite(): Promise<ArchiveGite> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return normaliserArchiveGite(undefined);
  try {
    return normaliserArchiveGite(JSON.parse(raw));
  } catch {
    return normaliserArchiveGite(undefined);
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveGite(archive: ArchiveGite): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
}

/** Tous les séjours, abandonnés compris (pour l'historique d'un client), du plus ancien au plus récent. */
export async function listTousLesSejours(): Promise<Sejour[]> {
  const { sejours } = await lireArchiveGite();
  return [...sejours].sort((a, b) => a.arrivee.localeCompare(b.arrivee));
}

/** Les séjours actifs : ceux dont le client a abandonné la réservation libèrent leur chambre et n'y figurent plus. */
export async function listSejours(): Promise<Sejour[]> {
  return (await listTousLesSejours()).filter((s) => !s.abandonne);
}

/**
 * Les séjours dont les repas sont prévus : les séjours maintenus (sauf ceux dont le client a renoncé aux repas), et ceux
 * abandonnés dont le client garde le restaurant.
 */
export async function listSejoursRestaurant(): Promise<Sejour[]> {
  return (await listTousLesSejours()).filter((s) => (s.abandonne ? s.restaurantMaintenu : !s.sansRestaurant));
}

export async function getSejour(id: string): Promise<Sejour | undefined> {
  return (await lireArchiveGite()).sejours.find((s) => s.id === id);
}

/** Le séjour (même abandonné) dont l'écriture comptable est cette facture : hébergement, repas, acompte, remboursement ou prestation. */
export async function sejourDeFacture(factureId: string): Promise<Sejour | undefined> {
  const { sejours } = await lireArchiveGite();
  return sejours.find(
    (s) =>
      s.factureId === factureId ||
      s.factureRepasId === factureId ||
      s.acompte?.factureId === factureId ||
      s.ajustements?.some((a) => a.factureId === factureId),
  );
}

/** Crée le séjour (sans identifiant) ou met à jour celui qui en a un. */
export async function enregistrerSejour(sejour: Omit<Sejour, 'id'> & { id?: string }): Promise<Sejour> {
  const archive = await lireArchiveGite();
  const complet: Sejour = { ...sejour, id: sejour.id ?? generateId() };
  const i = archive.sejours.findIndex((s) => s.id === complet.id);
  if (i >= 0) archive.sejours[i] = complet;
  else archive.sejours.push(complet);
  await remplacerArchiveGite(archive);
  return complet;
}

export async function supprimerSejour(id: string): Promise<void> {
  const archive = await lireArchiveGite();
  await remplacerArchiveGite({ ...archive, sejours: archive.sejours.filter((s) => s.id !== id) });
}

/** Les chambres du gîte, dans l'ordre de leur numéro. */
export async function listChambres(): Promise<Chambre[]> {
  return [...(await lireArchiveGite()).chambres].sort((a, b) => a.numero - b.numero);
}

/** Retire une chambre du gîte. Refusé (faux) tant qu'un séjour la réserve : on ne perd jamais une réservation. */
export async function supprimerChambre(numero: number): Promise<boolean> {
  const archive = await lireArchiveGite();
  if (archive.sejours.some((s) => s.chambres.includes(numero))) return false;
  await remplacerArchiveGite({ ...archive, chambres: archive.chambres.filter((c) => c.numero !== numero) });
  return true;
}

/** Ajoute une chambre, du côté donné du couloir, avec le numéro qui suit le plus grand. */
export async function ajouterChambre(cote: ValeurDe<typeof COTE_CHAMBRE>): Promise<Chambre> {
  const archive = await lireArchiveGite();
  const chambre: Chambre = { numero: Math.max(0, ...archive.chambres.map((c) => c.numero)) + 1, cote };
  await remplacerArchiveGite({ ...archive, chambres: [...archive.chambres, chambre] });
  return chambre;
}
