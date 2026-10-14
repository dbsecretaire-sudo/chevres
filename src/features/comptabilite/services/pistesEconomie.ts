import type { Rentabilite } from '@/features/comptabilite/services/rentabilite';
import type { ProductionLaitiere } from '@/features/exploitation/services/productionLaitiere';
import {
  analysesAntibiotiquePositif,
  pointsDeVigilance,
  vigilancesParParametre,
} from '@/features/exploitation/services/analysesLait';
import type { Controle } from '@/features/exploitation/types';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { ReglageInvestissement } from '@/features/settings/settings';
import { ATELIER } from '@/shared/constants/ateliers';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { SEUILS_VIGILANCE_LAIT, NIVEAU_VIGILANCE } from '@/shared/constants/controles';
import {
  CATEGORIES_INCOMPRESSIBLES,
  CATEGORIES_NEGOCIABLES,
  HAUSSE_COUT_ALIMENT_SIGNALEE,
  HAUSSE_LAIT_PAR_TRAITE_JUSTIFIEE,
  HYPOTHESES_ECONOMIE,
  HYPOTHESES_INVESTISSEMENT,
  INVESTISSEMENT,
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

/** Un poste qu'un investissement touche : les grains de l'alimentation, toute l'alimentation (quand les grains ne se distinguent pas) ou le carburant. */
export interface PostePisteInvestissement {
  cle: 'grains' | 'alimentation' | 'carburant';
  /** Ce que le poste a coûté dans l'année. */
  montant: number;
  /** Ce que l'investissement en ferait gagner par an. */
  economie: number;
  /** D'après les deux prix indiqués par l'utilisateur, ou d'après l'hypothèse de départ (`part`). */
  source: 'prix' | 'hypothese';
  part?: number;
}

/** Une piste d'investissement : ce qu'il ferait gagner par an sur les postes qu'il touche, et son remboursement quand le coût est connu. */
export interface PisteInvestissement {
  investissement: ValeurDe<typeof INVESTISSEMENT>;
  /** Ce que l'investissement ferait gagner par an. */
  economie: number;
  /** Les postes touchés : ce qu'ils ont coûté, ce que l'investissement en fait gagner, et d'où vient ce gain. */
  postes: PostePisteInvestissement[];
  /** Le coût estimé par l'utilisateur (€). */
  cout?: number;
  /** Le temps de remboursement, en années (coût / gain annuel). */
  remboursementAnnees?: number;
}

/** Un fromage de l'inventaire qui a un prix de vente et des litres de lait : de quoi le comparer à la vente du lait. */
export interface FromagePrixLitres {
  /** L'identifiant de l'article de l'inventaire (« fromage:frais »). */
  cle: string;
  libelle: string;
  prix: number;
  litresParFromage: number;
  /** Ce que coûtent les emballages d'un fromage vendu (€), d'après les achats. */
  coutEmballage: number;
}

/** Ce que rapporte le litre de lait transformé en un fromage, face au litre vendu. */
export interface LigneValorisation extends FromagePrixLitres {
  /** Ce que rapporte un litre de lait transformé en ce fromage (€). */
  prixParLitre: number;
  /** Ce que rapporterait le lait produit de l'année s'il était tout transformé en ce fromage (indicatif : sans les frais de fabrication). */
  productionPotentielle: number;
  /** Ce que cela rapporte de plus (ou de moins) que de vendre ce lait tel quel ; rien sans prix du lait. */
  gainSurLait?: number;
}

export interface ValorisationLait {
  /** Le prix du litre de lait vendu : celui de l'inventaire, à défaut le prix moyen des recettes. */
  prixLait?: number;
  /** Le total des paiements des récolteurs de l'année (les recettes de l'atelier lait) : ce que vaut le lait vendu tel quel, base des pourcentages. */
  recettesLait?: number;
  /** La part du lait que chaque fromage a réellement utilisée (en %, par clé de fromage) : le départ du tableau de répartition. */
  partsReelles?: Record<string, number>;
  /** Ce que coûte un gramme de sel, d'après ses achats : il entre dans les frais du brocciu. */
  coutSelParGramme?: number;
  litres: number;
  lignes: LigneValorisation[];
}

export interface EntreePlan {
  rentabilite: Rentabilite;
  /** Ce que l'utilisateur a indiqué de chaque investissement (coût, prix d'après devis). */
  investissements?: Partial<Record<ValeurDe<typeof INVESTISSEMENT>, ReglageInvestissement>>;
  /** Les grains achetés dans l'année (maïs, céréales…) : ce que le silo touche de l'alimentation. */
  grains?: { montant: number; quantiteKg: number };
  /** Les fromages de l'inventaire qui ont un prix et des litres de lait, et le prix du litre de lait de l'inventaire. */
  fromages?: FromagePrixLitres[];
  prixLaitInventaire?: number;
  partsReelles?: Record<string, number>;
  coutSelParGramme?: number;
  /** Le lait par chèvre et par traite, d'après l'inventaire. */
  production?: ProductionLaitiere;
  precedente?: AnneePrecedente;
  /** Les analyses du lait de l'année. */
  analyses: Controle[];
}

export interface PlanEconomies {
  /** Les charges de l'année (toutes) : ce que le coût du litre de lait répartit. */
  charges: number;
  pistes: Piste[];
  /** Les investissements examinés (silo à grain, cuve à gazole) : hors du total des économies, qui ne compte que ce qui se fait sans capital. */
  investissements: PisteInvestissement[];
  /** Le lait en fromage face au lait vendu (rien sans fromage ayant prix et litres). */
  valorisation?: ValorisationLait;
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
  // Les investissements : ce qu'ils feraient gagner sur les postes qu'ils touchent (alimentation, carburant)
  const montantDe = (categorie: string): number =>
    r.postes.filter((p) => p.categorie.split(':')[0] === categorie).reduce((t, p) => t + p.montant, 0);
  const investissements: PisteInvestissement[] = [];
  for (const investissement of Object.values(INVESTISSEMENT)) {
    const parts: Record<string, number> = HYPOTHESES_INVESTISSEMENT[investissement];
    const reglage = entree.investissements?.[investissement] ?? {};
    // Deux prix d'après devis (sacs et vrac, pompe et cuve) donnent le gain : l'écart, en part du poste, remplace l'hypothèse.
    const ecart =
      reglage.prixActuel &&
      reglage.prixAvecInvestissement &&
      reglage.prixAvecInvestissement < reglage.prixActuel
        ? 1 - reglage.prixAvecInvestissement / reglage.prixActuel
        : undefined;
    const postes: PostePisteInvestissement[] = [];
    const ajouter = (
      cle: PostePisteInvestissement['cle'],
      montant: number,
      part: number | undefined,
      avecPrix: boolean,
    ) => {
      if (!(montant > 0)) return;
      const source = avecPrix && ecart !== undefined ? 'prix' : 'hypothese';
      const taux = source === 'prix' ? ecart : part;
      if (taux === undefined) return;
      postes.push({
        cle,
        montant,
        economie: arrondi(montant * taux),
        source,
        part: source === 'hypothese' ? part : undefined,
      });
    };
    if (investissement === INVESTISSEMENT.SILO) {
      const alimentation = montantDe(CATEGORIE_DEPENSE.ALIMENTATION);
      const grains = entree.grains && entree.grains.montant > 0 ? entree.grains.montant : undefined;
      // Le silo ne touche que les grains ; quand ils ne se distinguent pas, c'est toute l'alimentation (hypothèse prudente à vérifier).
      if (grains !== undefined)
        ajouter(
          'grains',
          alimentation > 0 ? Math.min(grains, alimentation) : grains,
          parts.alimentation,
          true,
        );
      else ajouter('alimentation', alimentation, parts.alimentation, true);
      ajouter('carburant', montantDe(CATEGORIE_DEPENSE.CARBURANT), parts.carburant, false);
    } else {
      ajouter('carburant', montantDe(CATEGORIE_DEPENSE.CARBURANT), parts.carburant, true);
    }
    const economie = arrondi(postes.reduce((t, x) => t + x.economie, 0));
    if (!(economie > 0)) continue;
    const cout = reglage.cout;
    investissements.push({
      investissement,
      economie,
      postes,
      cout,
      remboursementAnnees: cout && cout > 0 ? cout / economie : undefined,
    });
  }

  // Le lait en fromage face au lait vendu
  const prixLait = entree.prixLaitInventaire ?? prixLitre;
  const valorisation: ValorisationLait | undefined =
    entree.fromages && entree.fromages.length > 0
      ? {
          prixLait,
          partsReelles: entree.partsReelles,
          coutSelParGramme: entree.coutSelParGramme,
          recettesLait: lait?.recettes,
          litres: litresProduits,
          lignes: entree.fromages.map((f) => {
            const prixParLitre = f.prix / f.litresParFromage;
            return {
              ...f,
              prixParLitre,
              productionPotentielle: arrondi(prixParLitre * litresProduits),
              gainSurLait:
                prixLait !== undefined ? arrondi((prixParLitre - prixLait) * litresProduits) : undefined,
            };
          }),
        }
      : undefined;
  return {
    charges: r.charges,
    pistes,
    investissements,
    valorisation,
    economieTotale,
    coutParLitre,
    coutParLitreApres,
    prixLitre,
    ecartParLitre,
    ecartParLitreApres,
    partCouverte,
  };
}
