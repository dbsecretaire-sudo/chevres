import type { Facture, Vente } from '@/features/comptabilite/types';
import { ajouterMois } from '@/features/comptabilite/services/tresorerie';
import { todayISO } from '@/shared/utils/dates';

/**
 * Une vente ou une facture dont on change le paiement : « pas encore payée » la met en attente (échéance d'un mois après sa date, à
 * modifier) ; la cocher payée l'enregistre payée aujourd'hui (la trésorerie compte la somme à cette date).
 */
export function avecPaiement<T extends Vente | Facture>(ecriture: T, enAttente: boolean): T {
  if (enAttente) {
    return {
      ...ecriture,
      payee: false,
      echeance: ecriture.echeance ?? ajouterMois(ecriture.date, 1),
      datePaiement: undefined,
    };
  }
  return {
    ...ecriture,
    payee: undefined,
    echeance: undefined,
    datePaiement: ecriture.payee === false ? todayISO() : ecriture.datePaiement,
  };
}
