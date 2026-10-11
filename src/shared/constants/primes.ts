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

/** Une tranche d'une aide dégressive : jusqu'à tant d'hectares, la part du montant qui est payée (en %). */
export interface TranchePrime {
  jusqua: number;
  pourcentage: number;
}

/** Les plafonds et conditions d'une aide : tout se règle dans Organisation › Cheptel, ce sont les valeurs proposées d'office. */
export interface ReglesPrime {
  /** Les plafonds d'une aide se multiplient par le nombre d'associés d'un GAEC (transparence). */
  transparenceGaec?: boolean;
  /** La quantité maximale comptée (hectares, animaux ou UGB) : au-delà, elle ne touche plus l'aide. */
  plafond?: number;
  /** La quantité minimale : en dessous, aucune aide. */
  minimum?: number;
  /** Le montant unitaire maximal (€) : un montant saisi plus haut est ramené à celui-ci. */
  plafondTaux?: number;
  /** Une part fixe par unité (€ par hectare), payée sur toute la quantité comptée (jusqu'au plafond), en plus du montant de la zone. */
  partFixe?: number;
  /** Le montant de la zone est dégressif : la part payée par tranche d'hectares (au-delà de la dernière tranche, rien pour la zone). */
  tranchesZone?: readonly TranchePrime[];
}

/**
 * Les règles d'office : le paiement redistributif est limité aux 52 premiers hectares admissibles ; l'ICHN à 75 hectares, avec une part
 * fixe de 70 € par hectare plus le montant de la zone, payé à 100 % sur les 25 premiers hectares, aux 2/3 de 25 à 50 ha, puis plus rien ; l'aide couplée aux petits ruminants demande au moins 10 femelles ; la
 * valeur d'un DPB est limitée (144,52 € en Corse en 2026). Le DPB est aussi limité par le nombre de droits du portefeuille (à saisir).
 * Indicatif : à vérifier chaque année dans la notice PAC.
 */
export const REGLES_PRIMES: Record<(typeof PRIMES)[number]['cle'], ReglesPrime> = {
  dpb: { plafondTaux: 144.52 },
  redistributif: { transparenceGaec: true, plafond: 52 },
  ecoregime: {},
  couplee_petits_ruminants: { minimum: 10 },
  ichn: {
    transparenceGaec: true,
    plafond: 75,
    partFixe: 70,
    tranchesZone: [
      { jusqua: 25, pourcentage: 100 },
      { jusqua: 50, pourcentage: 67 },
    ],
  },
};

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
