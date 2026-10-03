import { generateId } from '@/shared/utils/id';
import { yearOf } from '@/shared/utils/dates';
import { cleTriChevre } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre, Sexe, StatutChevre } from '@/features/cheptel/types';
import { deleteRecord, findRecord, getYears, loadAllYears, upsertRecord } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';

export async function listChevresVivantes(): Promise<Chevre[]> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all
    .filter((c) => c.statut === STATUT_CHEVRE.VIVANTE)
    .sort((a, b) => cleTriChevre(a).localeCompare(cleTriChevre(b)));
}

/** Chèvres mortes, abattues ou vendues : conservées mais masquées de la liste principale. */
export async function listChevresHistorique(): Promise<Chevre[]> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all
    .filter((c) => c.statut !== STATUT_CHEVRE.VIVANTE)
    .sort((a, b) => (b.dateStatut ?? '').localeCompare(a.dateStatut ?? ''));
}

/** Pour chaque mère (n° de boucle), la date de sa dernière mise bas connue. */
export async function dernieresMisesBasParMere(): Promise<Record<string, string>> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  const resultat: Record<string, string> = {};
  for (const c of all) {
    if (!c.mereNumeroBoucle) continue;
    const actuelle = resultat[c.mereNumeroBoucle];
    if (!actuelle || c.dateNaissance > actuelle) resultat[c.mereNumeroBoucle] = c.dateNaissance;
  }
  return resultat;
}

export async function getChevre(id: string): Promise<Chevre | undefined> {
  return findRecord(CATEGORIE_STOCKAGE.CHEPTEL, id);
}

/** mereId est toujours recalculé depuis mereNumeroBoucle : c'est ce lien qui alimente la descendance affichée sur la fiche de la mère. */
export async function saveChevre(chevre: Chevre): Promise<void> {
  const mereId = chevre.mereNumeroBoucle
    ? (await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)).find(
        (c) => c.numeroBoucle === chevre.mereNumeroBoucle && c.id !== chevre.id,
      )?.id
    : undefined;
  await upsertRecord(CATEGORIE_STOCKAGE.CHEPTEL, yearOf(chevre.dateNaissance), { ...chevre, mereId });
}

export async function creerChevre(input: {
  numeroBoucle?: string;
  dateBouclage?: string;
  nom?: string;
  sexe: Sexe;
  dateNaissance: string;
  mereId?: string;
  mereNumeroBoucle?: string;
  notes?: string;
  /** Permet de créer directement un cabrit mort-né (statut !== 'vivante' dès la naissance). */
  statut?: StatutChevre;
  renouvellement?: boolean;
  renouvellementAnnee?: number;
}): Promise<Chevre> {
  const statut = input.statut ?? STATUT_CHEVRE.VIVANTE;
  const chevre: Chevre = {
    id: generateId(),
    numeroBoucle: input.numeroBoucle,
    dateBouclage: input.dateBouclage,
    nom: input.nom,
    sexe: input.sexe,
    dateNaissance: input.dateNaissance,
    mereId: input.mereId,
    mereNumeroBoucle: input.mereNumeroBoucle,
    statut,
    dateStatut: statut !== STATUT_CHEVRE.VIVANTE ? input.dateNaissance : undefined,
    renouvellement: input.renouvellement,
    renouvellementAnnee: input.renouvellement ? input.renouvellementAnnee : undefined,
    notes: input.notes,
  };
  await saveChevre(chevre);
  return chevre;
}

/**
 * Supprime définitivement la fiche (contrairement à déclarer morte/abattoir/vendue,
 * qui garde l'enregistrement). Les fiches de sa descendance gardent son n° de boucle
 * en texte pour l'affichage, mais ne pourront plus être reliées à sa fiche.
 */
export async function supprimerChevre(id: string): Promise<void> {
  await deleteRecord(CATEGORIE_STOCKAGE.CHEPTEL, id);
}

export async function declarerStatutChevre(
  id: string,
  statut: StatutChevre,
  dateStatut: string,
): Promise<void> {
  const chevre = await getChevre(id);
  if (!chevre) return;
  await saveChevre({ ...chevre, statut, dateStatut });
}

export async function reactiverChevre(id: string): Promise<void> {
  const chevre = await getChevre(id);
  if (!chevre) return;
  await saveChevre({ ...chevre, statut: STATUT_CHEVRE.VIVANTE, dateStatut: undefined });
}

export async function chevresAnnees(): Promise<number[]> {
  return getYears(CATEGORIE_STOCKAGE.CHEPTEL);
}

/** Le n° de boucle doit être unique dans tout le cheptel (toutes années, tous statuts confondus). */
export async function numeroBoucleExiste(numeroBoucle: string, excludeId?: string): Promise<boolean> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all.some((c) => c.numeroBoucle === numeroBoucle && c.id !== excludeId);
}

export async function listDescendance(chevreId: string): Promise<Chevre[]> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all
    .filter((c) => c.mereId === chevreId)
    .sort((a, b) => b.dateNaissance.localeCompare(a.dateNaissance));
}

export async function resolveChevreIdParBoucle(numeroBoucle?: string): Promise<string | undefined> {
  if (!numeroBoucle?.trim()) return undefined;
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all.find((c) => c.numeroBoucle === numeroBoucle.trim())?.id;
}
