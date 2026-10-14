import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { categorieFournisseurDe, depensesDeLaCategorie } from '@/shared/dictionnaire/categoriesFournisseur';

/** Vrai quand un fournisseur peut avoir cette catégorie de dépense : sa catégorie de tiers la permet (un vétérinaire n'a que les dépenses vétérinaires). */
export const categorieDepenseAutorisee = (
  fournisseur: Pick<Fournisseur, 'categorie'> | undefined,
  categorieDepense: string,
): boolean => {
  const permises = depensesDeLaCategorie(categorieFournisseurDe(fournisseur?.categorie));
  return !permises || permises.includes(categorieDepense);
};

/** La catégorie de dépense qu'impose la catégorie du fournisseur (un vétérinaire : la dépense vétérinaire), ou rien quand elle n'en impose pas une seule. */
export const depenseImposee = (
  fournisseur: Pick<Fournisseur, 'categorie'> | undefined,
): string | undefined => {
  const permises = depensesDeLaCategorie(categorieFournisseurDe(fournisseur?.categorie));
  return permises?.length === 1 ? permises[0] : undefined;
};

/**
 * Vrai quand les fournitures d'un achat de production à ce fournisseur ne sont que des boucles : la chambre d'agriculture les fournit
 * (ses autres factures sont des dépenses « Autre »).
 */
export const fournituresSeulementBoucles = (
  fournisseur: Pick<Fournisseur, 'categorie'> | undefined,
): boolean => categorieFournisseurDe(fournisseur?.categorie).id === CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE;

/**
 * Les fournisseurs qui peuvent avoir une dépense déjà saisie (sa catégorie ne change pas) ; celui déjà inscrit sur l'écriture reste
 * proposé, même si sa catégorie a changé depuis.
 */
export const fournisseursPourLaDepense = (
  fournisseurs: Fournisseur[],
  categorieDepense: string | undefined,
  actuel?: string,
): Fournisseur[] =>
  categorieDepense
    ? fournisseurs.filter((x) => x.nomEntreprise === actuel || categorieDepenseAutorisee(x, categorieDepense))
    : fournisseurs;
