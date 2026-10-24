import type { ValeurDe } from '@/shared/constants/valeurDe';

/**
 * Le document de suivi des mouvements des brebis et/ou chèvres du dossier PAC (campagne de Corse) : la nomenclature du formulaire.
 */

/** Les trois catégories du formulaire (les colonnes « Jeunes », « Brebis ou chèvres éligibles » et « Béliers ou boucs »). */
export const CATEGORIE_SUIVI = {
  JEUNES: 'jeunes',
  FEMELLES: 'femelles',
  MALES: 'males',
} as const;

export type CategorieSuivi = ValeurDe<typeof CATEGORIE_SUIVI>;

/** Les causes d'entrée du lot (note 4 du formulaire). */
export const CAUSE_ENTREE = {
  NAISSANCE: 'N',
  ACHAT: 'A',
  CHANGEMENT_CATEGORIE: 'C',
  PRISE_EN_PENSION: 'P',
} as const;

/** Les causes de sortie du lot (note 5 du formulaire). */
export const CAUSE_SORTIE = {
  MORT: 'M',
  VENTE: 'V',
  MISE_EN_PENSION: 'P',
  CHANGEMENT_CATEGORIE: 'C',
  AUTRE: 'AU',
} as const;

/** L'âge (en mois) à partir duquel un jeune change de catégorie : un animal de plus d'un an n'est plus un jeune. */
export const MOIS_AVANT_CHANGEMENT_CATEGORIE = 12;

/** Le nombre de lignes de mouvements d'une page du formulaire. */
export const LIGNES_PAR_PAGE_SUIVI = 12;

/** Les cases du formulaire pour chaque numéro d'identification (une lettre ou un chiffre par case). */
export const CASES_NUMERO_PACAGE = 9;
export const CASES_NUMERO_SIRET = 14;
export const CASES_NUMERO_EXPLOITATION = 8;
export const CASES_NUMERO_PAGE = 2;

/** Les cases du bordereau de perte : les animaux perdus et remplacés (trois chiffres), le jour et le mois (deux chiffres) et l'année. */
export const CASES_NOMBRE_BORDEREAU = 3;
export const CASES_JOUR_MOIS = 2;
export const CASES_ANNEE = 4;

/** Le préfixe imprimé devant le n° d'exploitation du formulaire. */
export const PREFIXE_NUMERO_EXPLOITATION = 'FR';

/** Les espèces que le formulaire couvre, avec la colonne (celle des brebis ou celle des chèvres) qui leur correspond. */
export const COLONNE_SUIVI_PAR_ESPECE = {
  brebis: 'brebis',
  chevres: 'chevres',
} as const;

export type ColonneSuivi = ValeurDe<typeof COLONNE_SUIVI_PAR_ESPECE>;
