import type { Transaction } from '@/features/comptabilite/services/transactions';
import { SENS_TRANSACTION } from '@/shared/constants/comptabilite';
import { formatMontant } from '@/shared/utils/dates';

/** La balance d'une liste d'écritures : les recettes moins les dépenses (la part comptabilisée de chacune). */
export function balanceDesEcritures(ecritures: readonly Pick<Transaction, 'sens' | 'montantComptabilise'>[]): number {
  const somme = ecritures.reduce(
    (total, t) => total + (t.sens === SENS_TRANSACTION.ENTREE ? 1 : -1) * (t.montantComptabilise ?? 0),
    0,
  );
  return Math.round(somme * 100) / 100;
}

/** Une balance en chiffres seulement, signée : « +80,00 € », « -12,50 € ». */
export const texteDeBalance = (balance: number): string =>
  `${balance > 0 ? '+' : balance < 0 ? '-' : ''}${formatMontant(Math.abs(balance))}`;
