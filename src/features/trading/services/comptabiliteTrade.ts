import { getFacture, remplacerFacture, supprimerFacture } from '@/features/comptabilite/repository/factures';
import type { Facture } from '@/features/comptabilite/types';
import { resultatTrade } from '@/features/trading/services/calculs';
import type { Trade } from '@/features/trading/types';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { LABEL_SENS_TRADE } from '@/shared/textes/libelles';
import { formatDateFR } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

/**
 * Inscrit en comptabilité le résultat d'un trade clos : une recette « Gains de trading » s'il est positif, une dépense
 * « Pertes de trading » s'il est négatif (frais compris, à la date de sortie). Un trade ouvert ou à zéro n'a rien en
 * comptabilité. Renvoie l'identifiant de la facture, à garder dans le trade. Elle est ensuite modifiable en
 * comptabilité ; elle est recréée si on l'y a supprimée.
 */
export async function synchroniserFactureTrade(trade: Trade): Promise<string | undefined> {
  const existante = trade.factureId ? await getFacture(trade.factureId) : undefined;
  const resultat = resultatTrade(trade);
  if (resultat === undefined || resultat === 0) {
    if (existante) await supprimerFacture(existante.id);
    return undefined;
  }

  const gain = resultat > 0;
  const facture: Facture = {
    id: existante?.id ?? generateId(),
    activite: ACTIVITE_COMMUNE,
    date: trade.dateSortie!,
    type: gain ? TYPE_FACTURE.EMISE : TYPE_FACTURE.RECUE,
    tiers: trade.instrument,
    description: TEXTES.trading.compte.descriptionTrade(
      LABEL_SENS_TRADE[trade.sens],
      trade.instrument,
      formatDateFR(trade.dateEntree),
      formatDateFR(trade.dateSortie),
    ),
    montant: Math.abs(resultat),
    ...(gain
      ? { categorieRecette: CATEGORIE_RECETTE.GAINS_TRADING }
      : { categorieDepense: CATEGORIE_DEPENSE.PERTES_TRADING }),
  };
  // La facture est reconstruite en entier : un trade qui passe de gain à perte change de type et de catégorie.
  await remplacerFacture(facture);
  return facture.id;
}

/** Retire de la comptabilité la facture d'un trade supprimé. */
export async function supprimerFactureTrade(trade: Trade): Promise<void> {
  if (trade.factureId) await supprimerFacture(trade.factureId);
}
