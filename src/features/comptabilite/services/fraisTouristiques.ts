import type { Vehicule } from '@/features/settings/settings';
import { ATELIER } from '@/shared/constants/ateliers';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

/** Vrai quand l'atelier d'une charge est l'agritourisme : la case « Inclure dans les frais touristiques » est cochée. */
export const estFraisTouristique = (atelier: string | undefined): boolean => atelier === ATELIER.AGRITOURISME;

/** L'atelier que la case donne : l'agritourisme quand elle est cochée, aucun (charge commune) sinon. */
export const atelierDeLaCase = (cochee: boolean): string => (cochee ? ATELIER.AGRITOURISME : '');

/** Les catégories de contact dont les factures sont d'office des frais touristiques : l'office de tourisme (et ses partenaires) et le fournisseur du repas. */
const CATEGORIES_TOURISTIQUES: readonly string[] = [CATEGORIE_FOURNISSEUR.TOURISME, CATEGORIE_FOURNISSEUR.REPAS];

/**
 * Vrai quand une dépense se coche d'office comme frais touristique : son fournisseur est un contact de l'office de tourisme, d'un partenaire ou du repas, ou elle
 * concerne un véhicule marqué « utilisé pour le tourisme » (son assurance, ses réparations). L'utilisateur peut la décocher.
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
