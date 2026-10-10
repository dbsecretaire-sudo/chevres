import { generateId } from '@/shared/utils/id';
import { yearOf } from '@/shared/utils/dates';
import type { Vente } from '@/features/comptabilite/types';
import { retirerStockVente, synchroniserStockVente } from '@/features/stock/services/stock';
import { libererLotsVente, synchroniserLotsVente } from '@/features/stock/services/lots';
import { deleteRecord, findRecord, loadAllYears, loadYear, upsertRecord } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';

export async function enregistrerVente(input: Omit<Vente, 'id'>): Promise<Vente> {
  const vente: Vente = { id: generateId(), ...input };
  await upsertRecord(CATEGORIE_STOCKAGE.VENTES, yearOf(vente.date), vente);
  await synchroniserStockVente(vente);
  await synchroniserLotsVente(vente);
  return vente;
}

export async function listVentes(annee: number): Promise<Vente[]> {
  const items = await loadYear(CATEGORIE_STOCKAGE.VENTES, annee);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

/** Toutes les ventes, toutes années confondues, triées par date décroissante — utile pour lister les écritures liées à un client précis. */
export async function listToutesVentes(): Promise<Vente[]> {
  const items = await loadAllYears(CATEGORIE_STOCKAGE.VENTES);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function supprimerVente(id: string): Promise<void> {
  await deleteRecord(CATEGORIE_STOCKAGE.VENTES, id);
  await retirerStockVente(id);
  await libererLotsVente(id);
}

export async function getVente(id: string): Promise<Vente | undefined> {
  return findRecord(CATEGORIE_STOCKAGE.VENTES, id);
}

export async function saveVente(vente: Vente): Promise<void> {
  await upsertRecord(CATEGORIE_STOCKAGE.VENTES, yearOf(vente.date), vente);
  await synchroniserStockVente(vente);
  await synchroniserLotsVente(vente);
}
