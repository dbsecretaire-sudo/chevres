import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';

/** Ce sur quoi une prime se calcule : l'UGB du cheptel, le nombre d'animaux sevrés (par tête), ou les hectares admissibles. */
export const BASE_PRIME = {
  UGB: 'ugb',
  TETE: 'tete',
  HECTARE: 'hectare',
} as const;

/**
 * Les aides du cheptel et des surfaces, avec ce sur quoi elles se calculent : les aides découplées de la PAC (paiement de base,
 * paiement redistributif, écorégime), l'aide couplée aux petits ruminants (par animal) et l'ICHN (indemnité compensatoire de
 * handicaps naturels, à l'hectare). Les montants changent chaque année : ils se saisissent dans Organisation › Cheptel.
 */
export const PRIMES = [
  { cle: 'dpb', base: BASE_PRIME.HECTARE },
  { cle: 'redistributif', base: BASE_PRIME.HECTARE },
  { cle: 'ecoregime', base: BASE_PRIME.HECTARE },
  { cle: 'couplee_petits_ruminants', base: BASE_PRIME.TETE },
  { cle: 'ichn', base: BASE_PRIME.HECTARE },
] as const;

/**
 * Les coefficients UGB (unité de gros bétail) par animal de chaque espèce, indicatifs et modifiables : un animal sevré compte
 * « adulte », un petit non sevré compte « petit ». Ovins et caprins : 0,15 ; bovins : 1 ; autres espèces : à saisir si besoin.
 */
export const UGB_PAR_DEFAUT: Record<EspeceAnimale, { adulte: number; petit: number }> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: { adulte: 0.15, petit: 0 },
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: { adulte: 0.15, petit: 0 },
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: { adulte: 1, petit: 0.4 },
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: { adulte: 0.3, petit: 0 },
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: { adulte: 0.014, petit: 0 },
  [TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES]: { adulte: 0, petit: 0 },
};
