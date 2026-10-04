import { getFacture, remplacerFacture, supprimerFacture } from '@/features/comptabilite/repository/factures';
import type { Facture } from '@/features/comptabilite/types';
import type { Sejour } from '@/features/gite/types';
import { getSettings } from '@/features/settings/settings';
import {
  CATEGORIE_RECETTE,
  TAUX_TVA_RECETTE_ENTREPRISE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { formatDateFR } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

/**
 * La facture d'hébergement d'un séjour, telle qu'elle apparaît en comptabilité (recette « Hébergement », avec la TVA
 * de l'hébergement si l'entreprise y est assujettie).
 */
function factureDuSejour(sejour: Sejour, id: string, tvaApplicable: boolean): Facture {
  return {
    id,
    activite: ACTIVITE_COMMUNE,
    date: sejour.arrivee,
    type: TYPE_FACTURE.EMISE,
    tiers: sejour.nom,
    description: TEXTES.gite.sejour.descriptionFacture(
      sejour.chambre,
      formatDateFR(sejour.arrivee),
      formatDateFR(sejour.depart),
    ),
    montant: sejour.prix,
    categorieRecette: CATEGORIE_RECETTE.HEBERGEMENT,
    tauxTva: tvaApplicable ? TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.HEBERGEMENT] : undefined,
  };
}

/**
 * Crée ou met à jour la facture d'hébergement du séjour en comptabilité et renvoie son identifiant (rien si le séjour
 * n'a pas de prix : il n'y a alors rien à comptabiliser). La facture est ensuite modifiable en comptabilité ; elle est
 * recréée si on l'y a supprimée.
 */
export async function synchroniserFactureSejour(sejour: Sejour): Promise<string | undefined> {
  const existante = sejour.factureId ? await getFacture(sejour.factureId) : undefined;
  if (!(sejour.prix > 0)) {
    if (existante) await supprimerFacture(existante.id);
    return undefined;
  }
  const settings = await getSettings();
  const tvaApplicable = !!settings.exploitation?.entreprise?.tvaApplicable;
  const facture = factureDuSejour(sejour, existante?.id ?? generateId(), tvaApplicable);
  await remplacerFacture({ ...existante, ...facture });
  return facture.id;
}

/** Supprime la facture d'hébergement d'un séjour supprimé. */
export async function supprimerFactureSejour(sejour: Sejour): Promise<void> {
  if (sejour.factureId) await supprimerFacture(sejour.factureId);
}
