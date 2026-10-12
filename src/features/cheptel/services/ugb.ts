import type { InfosExploitation, ReglagesAides } from '@/features/settings/settings';
import {
  BASE_PRIME,
  PRIMES,
  REGLES_PRIMES,
  STABILISATEUR_DPB_PAR_ANNEE,
  STABILISATEUR_NEUTRE,
  UGB_PAR_DEFAUT,
  type TranchePrime,
} from '@/shared/constants/primes';
import { TEXTES } from '@/shared/textes';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** La clé des aides d'une année et d'une espèce (« 2026:chevres »). */
export const cleAides = (annee: number, espece: EspeceAnimale | string): string => `${annee}:${espece}`;

/**
 * Les aides d'une année et d'une espèce : celles enregistrées pour elles, à défaut celles de l'année précédente la plus proche de
 * la même espèce (un montant se reprend d'une année à l'autre tant qu'on ne le change pas), à défaut les réglages d'avant les années.
 */
export function reglagesDesAides(
  infos: InfosExploitation | undefined,
  annee: number,
  espece: EspeceAnimale | string,
): ReglagesAides {
  const parAnnee = infos?.ugbPrimes?.parAnnee ?? {};
  const exacte = parAnnee[cleAides(annee, espece)];
  if (exacte) return exacte;
  const precedente = Object.keys(parAnnee)
    .filter((cle) => cle.endsWith(`:${espece}`) && Number(cle.split(':')[0]) < annee)
    .sort((a, b) => Number(b.split(':')[0]) - Number(a.split(':')[0]))[0];
  if (precedente) return parAnnee[precedente];
  return {
    associes: infos?.ugbPrimes?.associes,
    primes: infos?.ugbPrimes?.primes,
    personnalisees: infos?.ugbPrimes?.personnalisees,
  };
}

/** Le stabilisateur (%) du paiement de base d'une année : celui des réglages, à défaut celui d'office de l'année, sinon aucun (100 %). */
export const stabilisateurDpb = (infos: InfosExploitation | undefined, annee: number): number =>
  infos?.ugbPrimes?.stabilisateurs?.[String(annee)] ??
  STABILISATEUR_DPB_PAR_ANNEE[annee] ??
  STABILISATEUR_NEUTRE;

/** La réduction (€) que représente un stabilisateur (%) sur un paiement avant réduction : 365 € pour 97,0805 % de 12 500 €. */
export const reductionDuStabilisateur = (brut: number, stabilisateur: number): number =>
  Math.round(((brut * (100 - stabilisateur)) / 100) * 100) / 100;

/** L'effectif déclaré d'une année et d'une espèce (rien quand il n'est pas saisi). */
export const effectifDeclare = (
  infos: InfosExploitation | undefined,
  annee: number,
  espece: EspeceAnimale | string,
): number | undefined => infos?.ugbPrimes?.effectifsDeclares?.[cleAides(annee, espece)];

/** Les informations de l'exploitation avec les aides d'une année et d'une espèce : de quoi calculer la prime de cette année-là. */
export function infosPourAnnee(
  infos: InfosExploitation | undefined,
  annee: number,
  espece: EspeceAnimale | string,
): InfosExploitation | undefined {
  if (!infos) return infos;
  const aides = reglagesDesAides(infos, annee, espece);
  return {
    ...infos,
    ugbPrimes: {
      ...infos.ugbPrimes,
      associes: aides.associes,
      primes: aides.primes,
      personnalisees: aides.personnalisees,
    },
  };
}

/** Ce sur quoi une prime se calcule : la base choisie dans les réglages, à défaut celle d'office de la prime (l'hectare pour une aide ajoutée). */
export function baseDeLaPrime(
  infos: InfosExploitation | undefined,
  cle: string,
): ValeurDe<typeof BASE_PRIME> {
  const choisie =
    infos?.ugbPrimes?.primes?.[cle]?.base ??
    infos?.ugbPrimes?.personnalisees?.find((p) => p.id === cle)?.base;
  const bases: readonly string[] = Object.values(BASE_PRIME);
  const parDefaut = PRIMES.find((p) => p.cle === cle)?.base ?? BASE_PRIME.HECTARE;
  return (choisie && bases.includes(choisie) ? choisie : parDefaut) as ValeurDe<typeof BASE_PRIME>;
}

type CleAideOffice = (typeof PRIMES)[number]['cle'];

/** Le nom d'une aide d'office : celui qu'on lui a donné, à défaut le nom d'origine (long, ou court pour le bilan). */
export function nomDeLAide(infos: InfosExploitation | undefined, cle: CleAideOffice, court = false): string {
  const choisi = infos?.ugbPrimes?.primes?.[cle]?.nom?.trim();
  const textes = TEXTES.cheptel.ugbPrimes.primes[cle];
  return choisi || (court ? textes.court : textes.titre);
}

/** Les plafonds d'une aide : ceux saisis, à défaut ceux d'office (REGLES_PRIMES, pour une aide d'office) ; une valeur de 0 veut dire « sans ». */
export interface PlafondsAide {
  transparenceGaec: boolean;
  plafond: number;
  minimum: number;
  plafondTaux: number;
  partFixe: number;
  tranchesZone: readonly TranchePrime[];
}

export function plafondsDeLAide(infos: InfosExploitation | undefined, cle: string): PlafondsAide {
  const reglage =
    infos?.ugbPrimes?.primes?.[cle] ?? infos?.ugbPrimes?.personnalisees?.find((p) => p.id === cle);
  const regles = (REGLES_PRIMES as Record<string, (typeof REGLES_PRIMES)[keyof typeof REGLES_PRIMES]>)[cle];
  return {
    transparenceGaec: !!regles?.transparenceGaec,
    plafond: reglage?.plafond ?? regles?.plafond ?? 0,
    minimum: reglage?.minimum ?? regles?.minimum ?? 0,
    plafondTaux: reglage?.plafondTaux ?? regles?.plafondTaux ?? 0,
    partFixe: reglage?.partFixe ?? regles?.partFixe ?? 0,
    tranchesZone: reglage?.tranchesZone ?? regles?.tranchesZone ?? [],
  };
}

/** Le nombre d'associés d'un GAEC (1 hors GAEC) : il multiplie les plafonds des aides en transparence. */
export const associesGaec = (infos: InfosExploitation | undefined): number =>
  Math.max(1, Math.round(infos?.ugbPrimes?.associes ?? 1));

/** Les animaux vivants d'une espèce : les petits (non sevrés) et les sevrés. */
export interface EffectifUgb {
  petits: number;
  sevres: number;
}

/** Les coefficients UGB d'une espèce : ceux de l'exploitation, à défaut ceux par défaut. */
export function coefficientsUgb(
  infos: InfosExploitation | undefined,
  espece: EspeceAnimale,
): { adulte: number; petit: number } {
  const choisis = infos?.ugbPrimes?.coefficients?.[espece];
  return {
    adulte: choisis?.adulte ?? UGB_PAR_DEFAUT[espece].adulte,
    petit: choisis?.petit ?? UGB_PAR_DEFAUT[espece].petit,
  };
}

/** L'UGB d'un effectif : les sevrés au coefficient adulte, les petits au coefficient petit (arrondi au millième). */
export const ugbDe = (effectif: EffectifUgb, coefficients: { adulte: number; petit: number }): number =>
  Math.round((effectif.sevres * coefficients.adulte + effectif.petits * coefficients.petit) * 1000) / 1000;

/** Un nombre d'UGB à l'écran : au plus deux décimales, la virgule, sans zéros inutiles (« 2,5 », « 32,7 »). */
export const formaterUgb = (valeur: number): string =>
  String(Math.round(valeur * 100) / 100).replace('.', ',');

/** Ce sur quoi les primes se calculent : l'UGB, le nombre d'animaux sevrés et les hectares admissibles. */
export interface QuantitesPrimes {
  ugb: number;
  tetes: number;
  hectares: number;
}

export interface LignePrime {
  cle: string;
  /** Le nom complet de l'aide, et un nom court pour le bilan (le même pour une aide ajoutée). */
  nom: string;
  nomCourt: string;
  base: ValeurDe<typeof BASE_PRIME>;
  taux: number;
  /** La quantité comptée (après plafond ou seuil) et celle d'avant. */
  quantite: number;
  quantiteBrute: number;
  /** Le montant unitaire retenu, s'il a été ramené au maximum permis. */
  tauxRetenu: number;
  /** Ce qui a joué : un plafond de quantité, le seuil minimal non atteint (et lequel), une dégressivité par tranches. */
  plafonnee: boolean;
  minimum?: number;
  degressive: boolean;
  /** Une aide en deux parts (l'ICHN) : la part fixe par unité et son montant, puis la zone (ses unités « pleines » après dégressivité et son montant). */
  partFixe: number;
  montantFixe: number;
  quantitePleine: number;
  montantZone: number;
  /** Le stabilisateur appliqué (% ; 100 : aucun, comme pour toute aide autre que le paiement de base) et le montant d'avant. */
  stabilisateur: number;
  montantAvantStabilisateur: number;
  montant: number;
}

/**
 * La prime prévisionnelle : pour chaque aide (d'office ou ajoutée) cochée dont le taux est renseigné, sa quantité (UGB, animaux ou hectares) multipliée
 * par son taux, et le total. Les plafonds se règlent aide par aide (plafond de quantité, seuil minimal, montant maximal, tranches
 * dégressives, nombre d'associés d'un GAEC). Une indication : les autres conditions d'éligibilité ne sont pas calculées.
 */
export function primesPrevisionnelles(
  infos: InfosExploitation | undefined,
  quantites: QuantitesPrimes,
  /** Le stabilisateur (%) du paiement de base de l'année (voir stabilisateurDpb) : il réduit seulement ce paiement. */
  stabilisateurDuDpb: number = STABILISATEUR_NEUTRE,
): { lignes: LignePrime[]; total: number } {
  const quantiteDe = (base: ValeurDe<typeof BASE_PRIME>) =>
    base === BASE_PRIME.UGB ? quantites.ugb : base === BASE_PRIME.TETE ? quantites.tetes : quantites.hectares;
  const associes = associesGaec(infos);
  /** Les hectares des DPB activés (la quantité comptée du paiement de base) : le paiement redistributif ne peut pas en compter plus. */
  let dpbActives: number | undefined;
  const ligne = (cle: string, nom: string, nomCourt: string, taux?: number): LignePrime[] => {
    if (!(taux && taux > 0)) return [];
    const base = baseDeLaPrime(infos, cle);
    // Le paiement redistributif porte sur les DPB activés (plafonnés à 52 ha), pas sur toute la surface admissible.
    const quantiteBrute =
      cle === 'redistributif' && base === BASE_PRIME.HECTARE && dpbActives !== undefined
        ? Math.min(quantiteDe(base), dpbActives)
        : quantiteDe(base);
    const regles = plafondsDeLAide(infos, cle);
    const multiple = regles.transparenceGaec ? associes : 1;
    const tranchesZone = regles.tranchesZone.map((t) => ({ ...t, jusqua: t.jusqua * multiple }));
    const sousMinimum = regles.minimum > 0 && quantiteBrute < regles.minimum;
    const limite = regles.plafond > 0 ? regles.plafond * multiple : undefined;
    const quantite = sousMinimum ? 0 : limite === undefined ? quantiteBrute : Math.min(quantiteBrute, limite);
    const tauxRetenu = regles.plafondTaux > 0 ? Math.min(taux, regles.plafondTaux) : taux;
    // Le montant de la zone : à plat, ou dégressif par tranches (au-delà de la dernière tranche, rien pour la zone).
    let quantitePleine = quantite;
    if (tranchesZone.length > 0) {
      let debut = 0;
      quantitePleine = 0;
      for (const t of tranchesZone) {
        quantitePleine += Math.max(0, Math.min(quantite, t.jusqua) - debut) * (t.pourcentage / 100);
        debut = t.jusqua;
      }
    }
    const montantZone = quantitePleine * tauxRetenu;
    const montantFixe = quantite * regles.partFixe;
    if (cle === 'dpb') dpbActives = quantite;
    const montantBrut = montantFixe + montantZone;
    const stabilisateur = cle === 'dpb' ? stabilisateurDuDpb : STABILISATEUR_NEUTRE;
    const montant = (montantBrut * stabilisateur) / 100;
    return [
      {
        cle,
        nom,
        nomCourt,
        base,
        taux,
        quantite,
        quantiteBrute,
        tauxRetenu,
        plafonnee: !sousMinimum && quantite < quantiteBrute,
        minimum: sousMinimum ? regles.minimum : undefined,
        degressive: tranchesZone.length > 0,
        partFixe: regles.partFixe,
        montantFixe: Math.round(montantFixe * 100) / 100,
        quantitePleine,
        montantZone: Math.round(montantZone * 100) / 100,
        stabilisateur,
        montantAvantStabilisateur: Math.round(montantBrut * 100) / 100,
        montant: Math.round(montant * 100) / 100,
      },
    ];
  };
  const lignes = [
    ...PRIMES.flatMap((p) => {
      const reglage = infos?.ugbPrimes?.primes?.[p.cle];
      return reglage?.actif
        ? ligne(p.cle, nomDeLAide(infos, p.cle), nomDeLAide(infos, p.cle, true), reglage.taux)
        : [];
    }),
    ...(infos?.ugbPrimes?.personnalisees ?? []).flatMap((p) =>
      p.actif ? ligne(p.id, p.nom, p.nom, p.taux) : [],
    ),
  ];
  return { lignes, total: Math.round(lignes.reduce((t, l) => t + l.montant, 0) * 100) / 100 };
}
