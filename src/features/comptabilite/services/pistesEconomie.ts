import type { Rentabilite } from '@/features/comptabilite/services/rentabilite';
import type { ProductionLaitiere } from '@/features/exploitation/services/productionLaitiere';
import {
  analysesAntibiotiquePositif,
  pointsDeVigilance,
  vigilancesParParametre,
} from '@/features/exploitation/services/analysesLait';
import type { Controle } from '@/features/exploitation/types';
import { ATELIER } from '@/shared/constants/ateliers';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { SEUILS_VIGILANCE_LAIT, NIVEAU_VIGILANCE } from '@/shared/constants/controles';
import {
  CATEGORIES_INCOMPRESSIBLES,
  CATEGORIES_NEGOCIABLES,
  HAUSSE_COUT_ALIMENT_SIGNALEE,
  HAUSSE_LAIT_PAR_TRAITE_JUSTIFIEE,
  HYPOTHESES_ECONOMIE,
  MOTS_POSTE_INCOMPRESSIBLE,
  MOTS_POSTE_NEGOCIABLE,
} from '@/shared/constants/economies';

/**
 * Ce que dit une piste : un poste à négocier, l'alimentation (urée du lait haute, ou coût du litre en hausse sans plus de lait), ou
 * un poste à ne pas toucher (alimentation quand l'urée est basse, vétérinaire quand les analyses sont mauvaises, ce qui est dû).
 */
export const TYPE_PISTE = {
  NEGOCIABLE: 'negociable',
  ALIMENT_UREE_HAUTE: 'aliment_uree_haute',
  ALIMENT_HAUSSE: 'aliment_hausse',
  ALIMENT_PRUDENCE: 'aliment_prudence',
  VETERINAIRE_PRUDENCE: 'veterinaire_prudence',
  INCOMPRESSIBLE: 'incompressible',
} as const;

export type TypePiste = (typeof TYPE_PISTE)[keyof typeof TYPE_PISTE];

export interface Piste {
  type: TypePiste;
  /** La catégorie du poste (celle de PosteCharges) et son nom quand il en a un (poste « Autre »). */
  categorie: string;
  libelle?: string;
  /** Ce que le poste a coûté dans l'année. */
  montant: number;
  /** Ce que la piste ferait gagner par an (0 pour un poste à ne pas toucher). */
  economie: number;
  /** Les chiffres qui motivent la piste (selon son type). */
  donnees?: {
    ureeMax?: number;
    ureeMin?: number;
    coutAlimentParLitre?: number;
    coutAlimentParLitrePrecedent?: number;
    litresParTraite?: number;
    litresParTraitePrecedent?: number;
    analysesCritiques?: number;
  };
}

/** Ce que l'année d'avant donnait : de quoi voir si un coût monte sans que le lait suive. */
export interface AnneePrecedente {
  coutAlimentParLitre?: number;
  litresParChevreParTraite?: number;
}

export interface EntreePlan {
  rentabilite: Rentabilite;
  /** Le lait par chèvre et par traite, d'après l'inventaire. */
  production?: ProductionLaitiere;
  precedente?: AnneePrecedente;
  /** Les analyses du lait de l'année. */
  analyses: Controle[];
}

export interface PlanEconomies {
  pistes: Piste[];
  /** Ce que toutes les pistes feraient gagner par an. */
  economieTotale: number;
  coutParLitre?: number;
  coutParLitreApres?: number;
  /** Le prix moyen auquel le lait est vendu (litre), d'après les recettes de l'atelier lait. */
  prixLitre?: number;
  /** Ce que le litre coûte de plus qu'il ne rapporte (avant, puis après les pistes) ; rien quand le prix ou le coût manque. */
  ecartParLitre?: number;
  ecartParLitreApres?: number;
  /** La part de l'écart que couvrent les pistes (0 à 1) ; rien quand il n'y a pas d'écart. */
  partCouverte?: number;
}

const contient = (nom: string, mots: readonly string[]): boolean => {
  const bas = nom.toLowerCase();
  return mots.some((m) => bas.includes(m));
};

/** La nature d'un poste de charges : négociable, incompressible, ou à part (l'alimentation et le vétérinaire ont leurs propres règles). */
function natureDuPoste(categorie: string, libelle?: string): 'negociable' | 'incompressible' | undefined {
  const base = categorie.split(':')[0];
  if (base === CATEGORIE_DEPENSE.AUTRE) {
    if (libelle && contient(libelle, MOTS_POSTE_INCOMPRESSIBLE)) return 'incompressible';
    if (libelle && contient(libelle, MOTS_POSTE_NEGOCIABLE)) return 'negociable';
    return undefined;
  }
  if (CATEGORIES_INCOMPRESSIBLES.includes(base)) return 'incompressible';
  if (CATEGORIES_NEGOCIABLES.includes(base)) return 'negociable';
  return undefined;
}

const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;

/**
 * Le plan d'économies (calcul pur) : des pistes chiffrées d'après les charges de l'année, le lait de l'inventaire et les analyses du
 * lait. Les charges négociables reçoivent l'hypothèse de départ de HYPOTHESES_ECONOMIE ; l'alimentation n'est touchée que si les
 * analyses (urée haute) ou la comparaison avec l'année d'avant (coût du litre en hausse sans plus de lait par traite) le justifient, et
 * jamais quand l'urée est basse ; le vétérinaire n'est pas touché quand les analyses sont critiques.
 */
export function construirePlan(entree: EntreePlan): PlanEconomies {
  const { rentabilite: r, production, precedente, analyses } = entree;
  const pistes: Piste[] = [];

  // Ce que disent les analyses du lait
  const urees = pointsDeVigilance(analyses, 'uree');
  const limiteHaute = SEUILS_VIGILANCE_LAIT.uree?.vigilanceMax;
  const limiteBasse = SEUILS_VIGILANCE_LAIT.uree?.vigilanceMin;
  const ureesHautes = urees.filter((p) => limiteHaute !== undefined && (p.valeur ?? 0) > limiteHaute);
  const ureesBasses = urees.filter((p) => limiteBasse !== undefined && (p.valeur ?? Infinity) < limiteBasse);
  const critiques =
    Object.values(vigilancesParParametre(analyses))
      .flat()
      .filter((p) => p?.niveau === NIVEAU_VIGILANCE.CRITIQUE).length +
    analysesAntibiotiquePositif(analyses).length;

  const litresParTraite = production?.litresParChevreParTraite;
  const litresProduits = r.litresProduits;

  for (const poste of r.postes) {
    const base = poste.categorie.split(':')[0];
    if (base === CATEGORIE_DEPENSE.ALIMENTATION) {
      const coutParLitre = litresProduits > 0 ? poste.montant / litresProduits : undefined;
      const donnees = {
        coutAlimentParLitre: coutParLitre,
        coutAlimentParLitrePrecedent: precedente?.coutAlimentParLitre,
        litresParTraite,
        litresParTraitePrecedent: precedente?.litresParChevreParTraite,
      };
      if (ureesBasses.length > 0) {
        // Une urée basse dit que l'apport azoté manque : couper dans l'alimentation ferait baisser le lait.
        pistes.push({
          type: TYPE_PISTE.ALIMENT_PRUDENCE,
          categorie: poste.categorie,
          libelle: poste.libelle,
          montant: poste.montant,
          economie: 0,
          donnees: { ...donnees, ureeMin: Math.min(...ureesBasses.map((p) => p.valeur ?? 0)) },
        });
      } else if (ureesHautes.length > 0) {
        pistes.push({
          type: TYPE_PISTE.ALIMENT_UREE_HAUTE,
          categorie: poste.categorie,
          libelle: poste.libelle,
          montant: poste.montant,
          economie: arrondi(poste.montant * HYPOTHESES_ECONOMIE.alimentUreeHaute),
          donnees: { ...donnees, ureeMax: Math.max(...ureesHautes.map((p) => p.valeur ?? 0)) },
        });
      } else if (
        coutParLitre !== undefined &&
        precedente?.coutAlimentParLitre !== undefined &&
        coutParLitre >= precedente.coutAlimentParLitre * HAUSSE_COUT_ALIMENT_SIGNALEE &&
        !(
          litresParTraite !== undefined &&
          precedente.litresParChevreParTraite !== undefined &&
          litresParTraite >= precedente.litresParChevreParTraite * HAUSSE_LAIT_PAR_TRAITE_JUSTIFIEE
        )
      ) {
        // Le litre coûte plus cher en aliment sans que chaque traite donne plus de lait : revenir au coût de l'année d'avant.
        pistes.push({
          type: TYPE_PISTE.ALIMENT_HAUSSE,
          categorie: poste.categorie,
          libelle: poste.libelle,
          montant: poste.montant,
          economie: arrondi((coutParLitre - precedente.coutAlimentParLitre) * litresProduits),
          donnees,
        });
      }
      continue;
    }
    if (base === CATEGORIE_DEPENSE.VETERINAIRE) {
      // Des analyses critiques disent qu'il ne faut pas économiser sur la santé du troupeau.
      if (critiques > 0) {
        pistes.push({
          type: TYPE_PISTE.VETERINAIRE_PRUDENCE,
          categorie: poste.categorie,
          libelle: poste.libelle,
          montant: poste.montant,
          economie: 0,
          donnees: { analysesCritiques: critiques },
        });
      }
      continue;
    }
    const nature = natureDuPoste(poste.categorie, poste.libelle);
    if (nature === 'negociable') {
      pistes.push({
        type: TYPE_PISTE.NEGOCIABLE,
        categorie: poste.categorie,
        libelle: poste.libelle,
        montant: poste.montant,
        economie: arrondi(poste.montant * HYPOTHESES_ECONOMIE.negociable),
      });
    } else if (nature === 'incompressible') {
      pistes.push({
        type: TYPE_PISTE.INCOMPRESSIBLE,
        categorie: poste.categorie,
        libelle: poste.libelle,
        montant: poste.montant,
        economie: 0,
      });
    }
  }
  pistes.sort((a, b) => b.economie - a.economie || b.montant - a.montant);

  const economieTotale = arrondi(pistes.reduce((t, p) => t + p.economie, 0));
  const lait = r.ateliers.find((a) => a.atelier === ATELIER.LAIT);
  const prixLitre = lait && litresProduits > 0 ? lait.recettes / litresProduits : undefined;
  const coutParLitre = r.coutParLitre;
  const coutParLitreApres =
    coutParLitre !== undefined ? (r.charges - economieTotale) / litresProduits : undefined;
  const ecartParLitre =
    coutParLitre !== undefined && prixLitre !== undefined ? coutParLitre - prixLitre : undefined;
  const ecartParLitreApres =
    coutParLitreApres !== undefined && prixLitre !== undefined ? coutParLitreApres - prixLitre : undefined;
  const partCouverte =
    ecartParLitre !== undefined && ecartParLitre > 0 && litresProduits > 0
      ? Math.min(1, economieTotale / (ecartParLitre * litresProduits))
      : undefined;
  return {
    pistes,
    economieTotale,
    coutParLitre,
    coutParLitreApres,
    prixLitre,
    ecartParLitre,
    ecartParLitreApres,
    partCouverte,
  };
}
