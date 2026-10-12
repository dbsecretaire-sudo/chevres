import { TYPE_AIDE } from '@/shared/constants/comptabilite';
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

/** Le type d'aide de la comptabilité (TYPE_AIDE) qui correspond à chaque aide d'office : ce qu'on a perçu s'y retrouve. */
export const TYPE_AIDE_PAR_PRIME: Record<(typeof PRIMES)[number]['cle'], string> = {
  dpb: TYPE_AIDE.PAIEMENT_BASE,
  redistributif: TYPE_AIDE.PAIEMENT_REDISTRIBUTIF,
  ecoregime: TYPE_AIDE.ECOREGIME,
  couplee_petits_ruminants: TYPE_AIDE.PETITS_RUMINANTS,
  ichn: TYPE_AIDE.ICHN,
};

/** La saison d'une prime : de septembre de l'année au dernier jour d'août de l'année suivante (les acomptes d'automne, le solde de l'hiver). */
export const MOIS_DEBUT_SAISON_PRIME = 9;

/** L'écart (€) en dessous duquel une prime calculée est tenue pour égale à celle perçue. */
export const TOLERANCE_PRIME_PERCUE = 1;

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
 * Les règles d'office : le paiement redistributif est limité aux 52 premiers hectares admissibles ; l'ICHN (note de cadrage de l'ODARC, Corse) à 50 hectares
 * de surfaces admissibles, plafond global pour 71.04, 71.05 et 71.06 réunies, avec le montant de la zone payé à 100 % sur les 25 premiers
 * hectares, aux 2/3 de 25 à 50 ha, puis plus rien (pas de part fixe) ; l'aide couplée aux petits ruminants demande au moins 10 femelles ; la
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
    plafond: 50,
    tranchesZone: [
      { jusqua: 25, pourcentage: 100 },
      { jusqua: 50, pourcentage: 66.6667 },
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

/** Le stabilisateur neutre (%) : le paiement n'est pas réduit. */
export const STABILISATEUR_NEUTRE = 100;

/**
 * Le stabilisateur des paiements de fin de campagne (%) par année : le paiement de base (DPB) perçu est la valeur calculée
 * multipliée par ce coefficient. Il ne change pas la valeur des DPB, seulement le montant payé. 2025 : 97,0805 %. Une année absente
 * n'en a pas ; il se modifie année par année dans Cheptel › Réglages. Quand on saisit la « réduction pour plafonnement budgétaire »
 * du relevé de situation, c'est elle qui compte (elle est ce que l'ASP a retenu), à la place de ce coefficient.
 */
export const STABILISATEUR_DPB_PAR_ANNEE: Record<number, number> = { 2025: 97.0805 };

/**
 * Les montants de l'ICHN en Corse par zone, pour les 25 premiers hectares de surfaces animales (note de cadrage de l'ODARC) : ceux des zones
 * autres que la montagne sèche, dont le montant se saisit avec l'aide, tant qu'on n'en a pas saisi d'autre. Indicatif : à vérifier chaque année.
 */
export const MONTANT_ICHN_PAR_ZONE: Record<string, number> = {
  haute_montagne_seche: 334,
  montagne_seche: 274,
  zscn: 192,
  zscs: 192,
};

/**
 * La réduction pour plafonnement budgétaire du paiement de base (%) par année : elle ne s'applique que lorsque le total des DPB demandés
 * dépasse le budget prévu, d'un pourcentage fixé chaque année (une année absente n'en a pas). 2025 : 3,8774 %, soit 386,65 € sur
 * 9 971,88 € d'après le relevé de situation du 17/06/2026. Elle se modifie année par année dans Cheptel › Réglages.
 */
export const REDUCTION_BUDGETAIRE_DPB_PAR_ANNEE: Record<number, number> = { 2025: 3.8774 };
