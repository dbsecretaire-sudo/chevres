import type { FiltresTransactions } from '@/features/comptabilite/components/FiltreTransactionsModal';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import { SENS_TRANSACTION } from '@/shared/constants/comptabilite';
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

/** Garde les transactions qui respectent les filtres (dates, montants) et contiennent le texte recherché. */
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
  /** Solde hors « autre » (montants comptabilisés). */
  balance: number;
  /** Solde toutes catégories incluses (montants réels). */
  balanceAvecAutre: number;
  totalRentrees: number;
  totalDepenses: number;
}

/**
 * « Autre » reste affiché dans la liste à titre indicatif (montant réel), mais sa part n'est pas
 * représentative de la santé financière de l'activité — exclue du solde via montantComptabilise.
 */
export function calculerSoldes(transactions: Transaction[]): SoldesTransactions {
  const signe = (t: Transaction) => (t.sens === SENS_TRANSACTION.ENTREE ? 1 : -1);
  const somme = (liste: Transaction[], valeur: (t: Transaction) => number) =>
    liste.reduce((s, t) => s + valeur(t), 0);

  return {
    balance: somme(transactions, (t) => (t.montantComptabilise ?? 0) * signe(t)),
    balanceAvecAutre: somme(transactions, (t) => (t.montant ?? 0) * signe(t)),
    totalRentrees: somme(
      transactions.filter((t) => t.sens === SENS_TRANSACTION.ENTREE),
      (t) => t.montantComptabilise ?? 0,
    ),
    totalDepenses: somme(
      transactions.filter((t) => t.sens === SENS_TRANSACTION.SORTIE),
      (t) => t.montantComptabilise ?? 0,
    ),
  };
}
