import type { Vehicule } from '@/features/settings/settings';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

/** Les catégories de contact dont les factures sont d'office des frais touristiques : l'office de tourisme (et ses partenaires) et le fournisseur du repas. */
const CATEGORIES_TOURISTIQUES: readonly string[] = [CATEGORIE_FOURNISSEUR.TOURISME, CATEGORIE_FOURNISSEUR.REPAS];

/**
 * Vrai quand une dépense se range d'office dans l'atelier Agritourisme : son fournisseur est un contact de l'office de tourisme, d'un partenaire ou du repas, ou elle
 * concerne un véhicule marqué « utilisé pour le tourisme » (son assurance, ses réparations). L'utilisateur change l'atelier concerné quand il veut.
 */
export function precocherFraisTouristiques(entree: {
  categorieFournisseur?: string;
  vehicule?: Pick<Vehicule, 'usageTouristique'>;
}): boolean {
  return (
    (!!entree.categorieFournisseur && CATEGORIES_TOURISTIQUES.includes(entree.categorieFournisseur)) ||
    !!entree.vehicule?.usageTouristique
  );
}

/** Le coût du carburant d'une visite : les kilomètres parcourus en charge, la consommation du véhicule (L/100 km) et le prix du litre (€) ; rien sans l'un des trois. */
export function coutCarburantDeLaVisite(entree: {
  km?: number;
  consommation?: number;
  prixLitre?: number;
}): number | undefined {
  const { km, consommation, prixLitre } = entree;
  if (!km || !consommation || !prixLitre || km <= 0 || consommation <= 0 || prixLitre <= 0) return undefined;
  return Math.round(km * (consommation / 100) * prixLitre * 100) / 100;
}
