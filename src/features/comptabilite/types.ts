import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import type {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  TYPE_AIDE,
  TYPE_ALIMENT,
  TYPE_CARBURANT,
  TYPE_FACTURE,
  TYPE_FROMAGE,
  UNITE_CONDITIONNEMENT,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';

export type TypeFacture = ValeurDe<typeof TYPE_FACTURE>;

/** Activité à laquelle se rattache une écriture : une espèce, ou « commun » (carburant, impôts…). */
export type ActiviteComptable = EspeceAnimale | typeof ACTIVITE_COMMUNE;

/** Catégorie de dépense pour une facture reçue (achat). */
export type CategorieDepense = ValeurDe<typeof CATEGORIE_DEPENSE>;

/** Catégorie de recette pour une facture émise (vente / aide). */
export type CategorieRecette = ValeurDe<typeof CATEGORIE_RECETTE>;

/**
 * Type d'aide agricole précis — utile pour s'y retrouver d'une année sur l'autre (chaque
 * ligne d'un relevé PAC correspond en général à l'une de ces catégories). Indiquez
 * l'organisme payeur (ODARC, ASP...) dans le champ "Client / organisme" de la facture.
 */
export type TypeAide = ValeurDe<typeof TYPE_AIDE>;

export type TypeAliment = ValeurDe<typeof TYPE_ALIMENT>;

export type TypeCarburant = ValeurDe<typeof TYPE_CARBURANT>;

/** Unités de conditionnement du fourrage (luzerne, foin, paille) — la quantité en kg est dérivée du nombre d'unités. */
export type UniteConditionnement = ValeurDe<typeof UNITE_CONDITIONNEMENT>;

export interface LigneAlimentation {
  type: TypeAliment;
  montant: number;
  /** Quantité en kg, facultative — utile pour calculer le kg par animal en plus du coût. Pour luzerne/foin/paille, dérivée de nombreUnitesConditionnement × poids unitaire. */
  quantiteKg?: number;
  /** Précision libre quand type === 'autre' (ex: "Frais de livraison", "Compléments minéraux"). */
  typeLibre?: string;
  /** Uniquement pour type luzerne/foin/paille : conditionnement saisi (conservé pour ré-affichage lors de la modification). */
  uniteConditionnement?: UniteConditionnement;
  /** Uniquement pour type luzerne/foin/paille : nombre d'unités saisi (conservé pour ré-affichage lors de la modification). */
  nombreUnitesConditionnement?: number;
}

export interface LigneCarburant {
  type: TypeCarburant;
  montant: number;
  /** Litrage facultatif — utile pour les aides calculées au litre (ex: GNR). */
  litrage?: number;
}

export interface Facture {
  id: string;
  date: string;
  type: TypeFacture;
  tiers: string; // fournisseur ou client
  /** Activité de la facture ; absente sur les anciennes factures (voir activiteFacture). */
  activite?: ActiviteComptable;
  description: string;
  montant: number;
  /** Uniquement pour type === 'recue'. */
  categorieDepense?: CategorieDepense;
  /** Uniquement si categorieDepense === 'alimentation' : une facture peut regrouper plusieurs aliments. */
  lignesAlimentation?: LigneAlimentation[];
  /** Uniquement pour type === 'emise'. */
  categorieRecette?: CategorieRecette;
  /**
   * Pertinent pour categorieRecette !== 'aide' : certaines recettes sont imposables, d'autres non —
   * à vérifier au cas par cas. Par défaut (non renseigné), une recette est considérée imposable.
   * Pour categorieRecette === 'aide', voir tauxImposition à la place (traitement plus fin par type).
   */
  imposable?: boolean;
  /** Uniquement pour categorieRecette === 'aide'. */
  typeAide?: TypeAide;
  /** Précision libre quand typeAide === 'autre' (ex: "Aide GNR guerre Ukraine", "Aide gros rouleurs"). */
  typeAideLibre?: string;
  /**
   * Uniquement pour categorieRecette === 'aide' : part (0-100) du montant incluse dans les recettes
   * brutes imposables du micro-BA. Pré-rempli à titre indicatif selon le type d'aide (voir
   * TAUX_IMPOSITION_TYPE_AIDE dans planComptable.ts) mais librement modifiable pour chaque aide, car le
   * traitement réel peut différer d'une aide à l'autre (à confirmer avec un comptable/CGA).
   */
  tauxImposition?: number;
  /** Ancien format (une facture = un seul type de carburant) — conservé pour les factures existantes, non écrit par les nouvelles saisies (voir lignesCarburant). */
  litrage?: number;
  /** Ancien format — voir lignesCarburant. */
  typeCarburant?: TypeCarburant;
  /** Uniquement si categorieDepense === 'carburant' : une facture peut regrouper plusieurs pleins/types. */
  lignesCarburant?: LigneCarburant[];
  /**
   * Uniquement pour categorieDepense === 'autre' ou categorieRecette === 'autre' : n° de compte PCG
   * choisi manuellement (les autres catégories ont un compte fixe, voir planComptable.ts).
   */
  compteManuel?: string;
  /** Uniquement pour type === 'recue' : taux de TVA (%) indiqué sur la facture d'achat, tel quel. */
  tauxTva?: number;
}

export type CategorieVente = ValeurDe<typeof CATEGORIE_VENTE>;
export type TypeFromage = ValeurDe<typeof TYPE_FROMAGE>;
export type UniteVente = ValeurDe<typeof UNITE_VENTE>;

export interface Vente {
  id: string;
  /** Activité (espèce) de la vente ; absente sur les anciennes ventes (voir activiteVente). */
  activite?: ActiviteComptable;
  date: string;
  categorie: CategorieVente;
  typeFromage?: TypeFromage; // utilisé quand categorie === 'fromage'
  typeFromageLibre?: string; // utilisé quand typeFromage === 'autre'
  quantite: number;
  unite: UniteVente;
  /** Non renseigné pour le lait : uniquement litrage + date. */
  prix?: number;
  /**
   * Taux de TVA (%) applicable à la vente — pré-rempli à titre indicatif selon la catégorie
   * (5,5 % fromage, 10 % cabris) mais librement modifiable, à confirmer avec votre comptable/CGA
   * selon votre régime de TVA (franchise en base, remboursement forfaitaire agricole, etc.).
   */
  tauxTva?: number;
  /** Nom du client, facultatif — préremplissable depuis la fiche client. */
  client?: string;
  /** Uniquement pour categorie === 'cabris' : poids total vendu, facultatif. */
  poidsKg?: number;
}
