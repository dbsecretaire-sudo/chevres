import { listFactures } from '@/features/comptabilite/repository/factures';
import type { Facture } from '@/features/comptabilite/types';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import {
  MOIS_DEBUT_SAISON_PRIME,
  PRIMES,
  TOLERANCE_PRIME_PERCUE,
  TYPE_AIDE_PAR_PRIME,
} from '@/shared/constants/primes';
import type { LignePrime } from '@/features/cheptel/services/ugb';

/** Ce qui a été perçu de chaque aide d'office (par clé de PRIMES) pendant la saison : les aides encaissées dans la comptabilité. */
export type PrimesPercues = Partial<Record<(typeof PRIMES)[number]['cle'], number>>;

const debutDeSaison = (annee: number) => `${annee}-${String(MOIS_DEBUT_SAISON_PRIME).padStart(2, '0')}-01`;
/** Le dernier jour d'août de l'année suivante : la veille du début de la saison d'après. */
const finDeSaison = (annee: number) =>
  `${annee + 1}-${String(MOIS_DEBUT_SAISON_PRIME - 1).padStart(2, '0')}-31`;

/** Les dates (début et fin) de la saison d'une année : du 1er septembre de l'année au 31 août suivant. */
export const saisonDePrime = (annee: number): { debut: string; fin: string } => ({
  debut: debutDeSaison(annee),
  fin: finDeSaison(annee),
});

/** Les aides perçues pendant la saison d'une année (septembre de l'année → août de la suivante), par aide d'office (calcul pur). */
export function calculerPrimesPercues(factures: Facture[], annee: number): PrimesPercues {
  const debut = debutDeSaison(annee);
  const fin = finDeSaison(annee);
  const percues: PrimesPercues = {};
  for (const f of factures) {
    if (f.type !== TYPE_FACTURE.EMISE || f.categorieRecette !== CATEGORIE_RECETTE.AIDE || !f.typeAide)
      continue;
    if (f.date < debut || f.date > fin) continue;
    const prime = PRIMES.find((p) => TYPE_AIDE_PAR_PRIME[p.cle] === f.typeAide);
    if (prime) percues[prime.cle] = (percues[prime.cle] ?? 0) + f.montant;
  }
  return percues;
}

/** Les aides perçues pendant la saison d'une année, d'après les factures enregistrées. */
export async function primesPercues(annee: number): Promise<PrimesPercues> {
  const [debut, fin] = await Promise.all([listFactures(annee), listFactures(annee + 1)]);
  return calculerPrimesPercues([...debut, ...fin], annee);
}

/** Une aide calculée, avec ce qui en a été perçu et si les deux diffèrent (seulement pour une aide d'office, qui a son type d'aide). */
export interface LignePrimeComparee extends LignePrime {
  percu?: number;
  ecart: boolean;
}

export function comparerAuxPercues(lignes: LignePrime[], percues: PrimesPercues): LignePrimeComparee[] {
  return lignes.map((l) => {
    const estOffice = PRIMES.some((p) => p.cle === l.cle);
    const percu = estOffice ? (percues[l.cle as keyof PrimesPercues] ?? 0) : undefined;
    return {
      ...l,
      percu,
      ecart: percu !== undefined && Math.abs(l.montant - percu) > TOLERANCE_PRIME_PERCUE,
    };
  });
}
