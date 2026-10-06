import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';

// Chiffre d'affaires et TVA d'une entreprise, calculés à partir de ses factures enregistrées (montants saisis TTC).
// Ces calculs organisent vos propres montants : ils ne remplacent pas une déclaration ni l'avis de votre comptable.

export interface LigneMensuelleEntreprise {
  mois: number; // 1-12
  /** Chiffre d'affaires hors taxes : les recettes de la période, hors aides et subventions. */
  caHt: number;
  caTtc: number;
  tvaCollectee: number;
  tvaDeductible: number;
}

export interface FiscaliteEntreprise {
  annee: number;
  mois: LigneMensuelleEntreprise[];
  caHt: number;
  caTtc: number;
  tvaCollectee: number;
  tvaDeductible: number;
  /** Aides et subventions encaissées : suivies à part, elles n'entrent pas dans le chiffre d'affaires. */
  aides: number;
}

/** TVA comprise dans un montant TTC au taux donné (0 sans taux). */
export const tvaDuTtc = (ttc: number, taux?: number): number => (taux ? ttc - ttc / (1 + taux / 100) : 0);

/** Chiffre d'affaires hors taxes, TVA collectée et déductible de l'année, mois par mois. */
export async function calculerFiscaliteEntreprise(annee: number): Promise<FiscaliteEntreprise> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);

  const mois: LigneMensuelleEntreprise[] = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    caHt: 0,
    caTtc: 0,
    tvaCollectee: 0,
    tvaDeductible: 0,
  }));
  let aides = 0;

  const indexMois = (date: string) => Number(date.slice(5, 7)) - 1;

  for (const v of ventes) {
    const m = indexMois(v.date);
    if (m < 0 || m > 11) continue;
    const ttc = v.prix ?? 0;
    const tva = tvaDuTtc(ttc, v.tauxTva);
    mois[m].caTtc += ttc;
    mois[m].caHt += ttc - tva;
    mois[m].tvaCollectee += tva;
  }

  for (const f of factures) {
    const m = indexMois(f.date);
    if (m < 0 || m > 11) continue;
    const tva = tvaDuTtc(f.montant, f.tauxTva);
    if (f.type === TYPE_FACTURE.RECUE) {
      mois[m].tvaDeductible += tva;
    } else if (f.categorieRecette === CATEGORIE_RECETTE.DEPOT) {
      // Un dépôt sur le compte n'est pas un chiffre d'affaires.
    } else if (f.categorieRecette === CATEGORIE_RECETTE.AIDE) {
      aides += f.montant;
    } else {
      mois[m].caTtc += f.montant;
      mois[m].caHt += f.montant - tva;
      mois[m].tvaCollectee += tva;
    }
  }

  const somme = (cle: keyof Omit<LigneMensuelleEntreprise, 'mois'>) => mois.reduce((s, l) => s + l[cle], 0);
  return {
    annee,
    mois,
    caHt: somme('caHt'),
    caTtc: somme('caTtc'),
    tvaCollectee: somme('tvaCollectee'),
    tvaDeductible: somme('tvaDeductible'),
    aides,
  };
}
