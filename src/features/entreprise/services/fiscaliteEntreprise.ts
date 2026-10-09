import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';

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

/** Une recette qui compte dans le chiffre d'affaires : sa vente ou sa facture, son mois et ses montants. */
export interface RecetteEntreprise {
  /** 1 à 12 */
  mois: number;
  ttc: number;
  tva: number;
  vente?: Vente;
  facture?: Facture;
}

const indexMois = (date: string) => Number(date.slice(5, 7)) - 1;

/**
 * Les recettes de l'année qui font le chiffre d'affaires : les ventes que le client souhaite déclarer (avec facture) et les
 * factures émises (hors aides, subventions et dépôts sur le compte), et, pour l'URSSAF, les remboursements en négatif.
 */
export async function recettesDeLAnnee(
  annee: number,
  /** Vrai pour l'URSSAF : un remboursement fait à un client vient en déduction du chiffre d'affaires du mois où il est fait. */
  avecRemboursements = false,
): Promise<RecetteEntreprise[]> {
  const [toutesVentes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);
  const recettes: RecetteEntreprise[] = [];

  for (const vente of toutesVentes.filter(venteADeclarer)) {
    const m = indexMois(vente.date);
    if (m < 0 || m > 11) continue;
    const ttc = vente.prix ?? 0;
    recettes.push({ mois: m + 1, ttc, tva: tvaDuTtc(ttc, vente.tauxTva), vente });
  }

  for (const facture of factures) {
    const m = indexMois(facture.date);
    if (m < 0 || m > 11) continue;
    if (facture.type === TYPE_FACTURE.RECUE) {
      if (avecRemboursements && facture.categorieDepense === CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT) {
        recettes.push({
          mois: m + 1,
          ttc: -facture.montant,
          tva: -tvaDuTtc(facture.montant, facture.tauxTva),
          facture,
        });
      }
      continue;
    }
    // Un dépôt sur le compte n'est pas un chiffre d'affaires ; une aide est suivie à part.
    if (
      facture.categorieRecette === CATEGORIE_RECETTE.DEPOT ||
      facture.categorieRecette === CATEGORIE_RECETTE.AIDE
    ) {
      continue;
    }
    recettes.push({
      mois: m + 1,
      ttc: facture.montant,
      tva: tvaDuTtc(facture.montant, facture.tauxTva),
      facture,
    });
  }
  return recettes;
}

/** Chiffre d'affaires hors taxes, TVA collectée et déductible de l'année, mois par mois. */
export async function calculerFiscaliteEntreprise(annee: number): Promise<FiscaliteEntreprise> {
  const [recettes, factures] = await Promise.all([recettesDeLAnnee(annee), listFactures(annee)]);

  const mois: LigneMensuelleEntreprise[] = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    caHt: 0,
    caTtc: 0,
    tvaCollectee: 0,
    tvaDeductible: 0,
  }));
  let aides = 0;

  for (const r of recettes) {
    const ligne = mois[r.mois - 1];
    ligne.caTtc += r.ttc;
    ligne.caHt += r.ttc - r.tva;
    ligne.tvaCollectee += r.tva;
  }

  for (const f of factures) {
    const m = indexMois(f.date);
    if (m < 0 || m > 11) continue;
    if (f.type === TYPE_FACTURE.RECUE) mois[m].tvaDeductible += tvaDuTtc(f.montant, f.tauxTva);
    else if (f.categorieRecette === CATEGORIE_RECETTE.AIDE) aides += f.montant;
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
