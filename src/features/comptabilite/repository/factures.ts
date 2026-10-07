import { generateId } from '@/shared/utils/id';
import { yearOf } from '@/shared/utils/dates';
import type { Facture } from '@/features/comptabilite/types';
import { deleteRecord, findRecord, loadAllYears, loadYear, upsertRecord } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';

export async function enregistrerFacture(input: Omit<Facture, 'id'>): Promise<Facture> {
  const facture: Facture = { id: generateId(), ...input };
  await upsertRecord(CATEGORIE_STOCKAGE.FACTURES, yearOf(facture.date), facture);
  return facture;
}

/** Enregistre une facture qui a déjà son identifiant (la crée ou la met à jour, même si sa date change d'année). */
export async function remplacerFacture(facture: Facture): Promise<void> {
  await upsertRecord(CATEGORIE_STOCKAGE.FACTURES, yearOf(facture.date), facture);
}

export async function getFacture(id: string): Promise<Facture | undefined> {
  return findRecord(CATEGORIE_STOCKAGE.FACTURES, id);
}

export async function listFactures(annee: number): Promise<Facture[]> {
  const items = await loadYear(CATEGORIE_STOCKAGE.FACTURES, annee);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

/** Toutes les factures, toutes années confondues, triées par date décroissante — utile pour lister les écritures liées à un tiers précis. */
export async function listToutesFactures(): Promise<Facture[]> {
  const items = await loadAllYears(CATEGORIE_STOCKAGE.FACTURES);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function supprimerFacture(id: string): Promise<void> {
  await deleteRecord(CATEGORIE_STOCKAGE.FACTURES, id);
}
