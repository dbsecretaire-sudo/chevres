import type { FiltresTransactions } from '@/features/comptabilite/components/FiltreTransactionsModal';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import type { ActiviteComptable } from '@/features/comptabilite/types';
import {
  SENS_TRANSACTION,
} from '@/shared/constants/comptabilite';
import { formatDateFR } from '@/shared/utils/dates';

export const FILTRES_VIDES: FiltresTransactions = {
  dateDebut: '',
  dateFin: '',
  montantMin: '',
  montantMax: '',
};

export const filtresSontActifs = (f: FiltresTransactions) =>
  !!(f.dateDebut || f.dateFin || f.montantMin || f.montantMax);

const enNombre = (texte: string) => (texte ? Number(texte.replace(',', '.')) : undefined);

const enTexteMontant = (montant: number | undefined) =>
  montant !== undefined ? String(montant).replace('.', ',') : '';

/**
 * Garde les transactions qui respectent les filtres (dates, montants) et contiennent le texte recherché : dans le titre, le
 * détail, la date, les montants et le nom de la catégorie (chercher « alimentation » donne les achats d'alimentation).
 */
export function filtrerTransactions(
  transactions: Transaction[],
  filtres: FiltresTransactions,
  recherche: string,
): Transaction[] {
  const min = enNombre(filtres.montantMin);
  const max = enNombre(filtres.montantMax);
  const recherchee = recherche.trim().toLowerCase();

  return transactions.filter((t) => {
    if (filtres.dateDebut && t.date < filtres.dateDebut) return false;
    if (filtres.dateFin && t.date > filtres.dateFin) return false;
    if (min !== undefined || max !== undefined) {
      if (t.montant === undefined) return false;
      if (min !== undefined && t.montant < min) return false;
      if (max !== undefined && t.montant > max) return false;
    }
    if (recherchee) {
      const champs = [
        t.titre,
        t.sousTitre,
        t.libelleCategorie,
        ...(t.termes ?? []),
        t.date ? formatDateFR(t.date) : '',
        enTexteMontant(t.montant),
        enTexteMontant(t.montantComptabilise),
      ];
      if (!champs.some((c) => (c ?? '').toString().toLowerCase().includes(recherchee))) return false;
    }
    return true;
  });
}

export interface SoldesTransactions {
  /** Solde : toutes les écritures, sans exception (alimentation, matériel, « Autre »…). */
  balance: number;
  totalRentrees: number;
  /** Les rentrées avec facture : les ventes que le client souhaite déclarer, et les factures émises (aides, autres recettes). */
  rentreesAvecFactures: number;
  /** Les rentrées des ventes sans facture (le client ne souhaite pas les déclarer). */
  rentreesSansFactures: number;
  totalDepenses: number;
}

/**
 * Le solde additionne toutes les écritures, sans exclure aucune catégorie. Pour une facture répartie entre des cheptels, c'est
 * la part de l'activité qui compte (montantComptabilise), pas le total de la facture : elle n'est comptée qu'une fois.
 */
export function calculerSoldes(transactions: Transaction[]): SoldesTransactions {
  const signe = (t: Transaction) => (t.sens === SENS_TRANSACTION.ENTREE ? 1 : -1);
  const somme = (liste: Transaction[], valeur: (t: Transaction) => number) =>
    liste.reduce((s, t) => s + valeur(t), 0);

  const rentrees = transactions.filter((t) => t.sens === SENS_TRANSACTION.ENTREE);
  return {
    balance: somme(transactions, (t) => (t.montantComptabilise ?? 0) * signe(t)),
    totalRentrees: somme(rentrees, (t) => t.montantComptabilise ?? 0),
    rentreesAvecFactures: somme(
      rentrees.filter((t) => !t.sansFacture),
      (t) => t.montantComptabilise ?? 0,
    ),
    rentreesSansFactures: somme(
      rentrees.filter((t) => t.sansFacture),
      (t) => t.montantComptabilise ?? 0,
    ),
    totalDepenses: somme(
      transactions.filter((t) => t.sens === SENS_TRANSACTION.SORTIE),
      (t) => t.montantComptabilise ?? 0,
    ),
  };
}

/** Valeur du filtre « activité » qui garde toutes les écritures. */
export const TOUTES_ACTIVITES = 'toutes';
export type FiltreActivite = ActiviteComptable | typeof TOUTES_ACTIVITES;

/** Garde les écritures d'une activité (toutes si le filtre est « toutes »). */
export const filtrerParActivite = (transactions: Transaction[], filtre: FiltreActivite): Transaction[] =>
  filtre === TOUTES_ACTIVITES ? transactions : transactions.filter((t) => t.activite === filtre);

/** Les écritures rangées par tiers (leur nom, sans tenir compte de la casse ni des accents), puis de la plus récente à la plus ancienne. */
export function ecrituresParTiers<T extends { titre: string; date: string }>(ecritures: readonly T[]): T[] {
  return [...ecritures].sort(
    (a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }) || b.date.localeCompare(a.date),
  );
}
