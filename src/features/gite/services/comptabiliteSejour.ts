import { getFacture, remplacerFacture, supprimerFacture } from '@/features/comptabilite/repository/factures';
import type { Facture } from '@/features/comptabilite/types';
import { tvaDuTtc } from '@/features/entreprise/services/fiscaliteEntreprise';
import type { Sejour } from '@/features/gite/types';
import { tarifDuSejour } from '@/features/gite/services/tarifSejour';
import { getSettings } from '@/features/settings/settings';
import {
  CATEGORIE_RECETTE,
  TAUX_TVA_RECETTE_ENTREPRISE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { nuitsDuSejour } from '@/shared/utils/calendrier';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gite.sejour;

/** La facture qu'un séjour crée en comptabilité (`factureRepasId` : l'ancienne recette des repas, retirée au passage). */
export interface FacturesSejour {
  factureId?: string;
  factureRepasId?: string;
}

/**
 * Le taux de TVA (%) qui, appliqué au total payé, donne la TVA de l'hébergement et des repas : la taxe de séjour, comprise
 * dans le total, n'en porte pas.
 */
function tauxTvaDuSejour(hebergement: number, restauration: number, total: number): number {
  const tva =
    tvaDuTtc(hebergement, TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.HEBERGEMENT]) +
    tvaDuTtc(restauration, TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.RESTAURATION]);
  return total > tva ? Math.round((total / (total - tva) - 1) * 10000) / 100 : 0;
}

/**
 * Met la recette du séjour en comptabilité à jour — seulement une fois le paiement validé (sinon elle est retirée) : une
 * seule recette « Hébergement » du total payé (chambres × nuits × prix, taxe de séjour, repas), dont la description
 * donne le détail. Elle est ensuite modifiable en comptabilité ; elle est recréée si on l'y a supprimée.
 */
export async function synchroniserFacturesSejour(sejour: Sejour): Promise<FacturesSejour> {
  if (!sejour.paye) {
    await supprimerFacturesSejour(sejour);
    return { factureId: undefined, factureRepasId: undefined };
  }
  const settings = await getSettings();
  const tvaApplicable = !!settings.exploitation?.entreprise?.tvaApplicable;
  const tarif = tarifDuSejour(sejour);
  const nuits = nuitsDuSejour(sejour.arrivee, sejour.depart).length;

  // Les séjours d'avant le détail du prix n'ont pas de prix par nuit : on n'en donne que le montant.
  const details = [
    sejour.prixNuit !== undefined
      ? T.detailHebergement(sejour.chambres.length, nuits, formatMontant(sejour.prixNuit))
      : T.detailHebergementTotal(formatMontant(tarif.hebergement)),
    ...(tarif.taxe > 0 ? [T.detailTaxe(formatMontant(tarif.taxe))] : []),
    ...(tarif.restauration > 0
      ? [T.detailRepas(sejour.repas ?? 0, formatMontant(sejour.prixRepas ?? 0))]
      : []),
  ];

  // L'ancienne recette des repas (séjours enregistrés avant le total unique) est retirée.
  if (sejour.factureRepasId) await supprimerFacture(sejour.factureRepasId);

  const existante = sejour.factureId ? await getFacture(sejour.factureId) : undefined;
  if (!(tarif.total > 0)) {
    if (existante) await supprimerFacture(existante.id);
    return { factureId: undefined, factureRepasId: undefined };
  }
  const facture: Facture = {
    id: existante?.id ?? generateId(),
    activite: ACTIVITE_COMMUNE,
    // Une recette compte à la date où on l'encaisse.
    date: sejour.datePaiement ?? sejour.arrivee,
    type: TYPE_FACTURE.EMISE,
    tiers: sejour.nom,
    description: T.descriptionSejour(
      T.chambresListe(sejour.chambres),
      formatDateFR(sejour.arrivee),
      formatDateFR(sejour.depart),
      details,
    ),
    montant: tarif.total,
    categorieRecette: CATEGORIE_RECETTE.HEBERGEMENT,
    tauxTva: tvaApplicable ? tauxTvaDuSejour(tarif.hebergement, tarif.restauration, tarif.total) : undefined,
  };
  await remplacerFacture({ ...existante, ...facture });
  return { factureId: facture.id, factureRepasId: undefined };
}

/** Supprime la ou les factures d'un séjour supprimé. */
export async function supprimerFacturesSejour(sejour: Sejour): Promise<void> {
  if (sejour.factureId) await supprimerFacture(sejour.factureId);
  if (sejour.factureRepasId) await supprimerFacture(sejour.factureRepasId);
}
