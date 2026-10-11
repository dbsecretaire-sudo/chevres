import type { InfosExploitation } from '@/features/settings/settings';
import { BASE_PRIME, PRIMES, UGB_PAR_DEFAUT } from '@/shared/constants/primes';
import { TEXTES } from '@/shared/textes';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import type { ValeurDe } from '@/shared/constants/valeurDe';

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
  quantite: number;
  montant: number;
}

/**
 * La prime prévisionnelle : pour chaque aide (d'office ou ajoutée) cochée dont le taux est renseigné, sa quantité (UGB, animaux ou hectares) multipliée
 * par son taux, et le total. Une indication d'après les taux saisis : les conditions d'éligibilité et les plafonds ne sont pas calculés.
 */
export function primesPrevisionnelles(
  infos: InfosExploitation | undefined,
  quantites: QuantitesPrimes,
): { lignes: LignePrime[]; total: number } {
  const quantiteDe = (base: ValeurDe<typeof BASE_PRIME>) =>
    base === BASE_PRIME.UGB ? quantites.ugb : base === BASE_PRIME.TETE ? quantites.tetes : quantites.hectares;
  const ligne = (cle: string, nom: string, nomCourt: string, taux?: number): LignePrime[] => {
    if (!(taux && taux > 0)) return [];
    const base = baseDeLaPrime(infos, cle);
    const quantite = quantiteDe(base);
    return [{ cle, nom, nomCourt, base, taux, quantite, montant: Math.round(quantite * taux * 100) / 100 }];
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
