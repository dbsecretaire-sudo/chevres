import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentYear } from '@/shared/utils/dates';
import { cleStockage } from '@/features/etablissements/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import type { PieceJointe } from '@/features/fichiers/types';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { definirCategoriesClient, type CategorieClientReglage } from '@/shared/dictionnaire/categoriesClient';
import { definirTauxParProduit, type TauxParProduit } from '@/shared/dictionnaire/tauxParProduit';
import {
  definirCategoriesFournisseur,
  type CategorieFournisseurReglage,
} from '@/shared/dictionnaire/categoriesFournisseur';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { CLE_LISTE_PERSONNALISEE } from '@/shared/constants/controles';
import type {
  NATURE_URSSAF,
  REGIME_FISCAL,
  REGIME_TVA,
  STATUT_JURIDIQUE,
} from '@/shared/constants/entreprise';

const cle = () => cleStockage(CLE_STOCKAGE.SETTINGS);

/** Ce qui identifie le cheptel d'une espèce : son n° de cheptel et l'indicatif qui précède ses numéros de boucle. */
export interface IdentificationCheptel {
  numeroCheptel?: string;
  indicatifMarquage?: string;
}

/** Les réglages de la trésorerie : le solde (€) du compte à la date donnée, et le seuil (€) sous lequel une alerte s'affiche. */
export interface ReglagesTresorerie {
  soldeDepart?: number;
  /** AAAA-MM-JJ : la date du solde de départ. */
  dateSolde?: string;
  seuilAlerte?: number;
}

/** Un emprunt : sa mensualité (€), sa première échéance (AAAA-MM-JJ) et son nombre d'échéances, une par mois. */
export interface Emprunt {
  id: string;
  nom: string;
  mensualite: number;
  premiereEcheance: string;
  nombreEcheances: number;
}

/** Les réglages de TVA du pilotage : le régime, la périodicité du découpage et, au remboursement forfaitaire agricole, son taux (%). */
export interface ReglagesTva {
  regime?: string;
  periodicite?: string;
  tauxRfa?: number;
}

/** Les aides d'une année et d'une espèce : le nombre d'associés d'un GAEC, les aides d'office (par clé) et celles ajoutées. */
export interface ReglagesAides {
  /** Le nombre d'associés d'un GAEC : il multiplie les plafonds des aides en transparence (1 hors GAEC). */
  associes?: number;
  primes?: Record<string, ReglagePrime & { nom?: string }>;
  /** Les aides ajoutées par l'utilisateur (en plus de PRIMES) : elles comptent dans la prime prévisionnelle comme les autres. */
  personnalisees?: (ReglagePrime & { id: string; nom: string })[];
}

/** Les réglages d'une aide : si elle compte, son montant, sa base et ses plafonds (voir InfosExploitation.ugbPrimes). */
export interface ReglagePrime {
  actif?: boolean;
  taux?: number;
  base?: string;
  plafond?: number;
  minimum?: number;
  plafondTaux?: number;
  partFixe?: number;
  tranchesZone?: { jusqua: number; pourcentage: number }[];
  /** L'ICHN par zone : le montant (€/ha) de chaque zone autre que la montagne sèche (`taux`) ; les hectares de chaque zone sont ceux des parcelles (Contrôles de surface). */
  tauxParZone?: Record<string, number>;
  /** La majoration (%) des montants de l'ICHN pour un cheptel de petits ruminants (+10 % en montagne, +30 % en zones à contraintes, d'après l'ODARC). */
  majorationPetitsRuminants?: number;
}

/** Informations d'une entreprise (hors élevage) ; tout est modifiable : statut, régimes, TVA, taxe de séjour. */
export interface InfosEntreprise {
  nomEntreprise?: string;
  dirigeant?: string;
  adresse?: string;
  siret?: string;
  codeApe?: string;
  numeroTva?: string;
  statut?: ValeurDe<typeof STATUT_JURIDIQUE>;
  regimeFiscal?: ValeurDe<typeof REGIME_FISCAL>;
  /** Vrai si l'entreprise facture avec TVA ; absent ou faux : sans TVA (franchise en base). */
  tvaApplicable?: boolean;
  regimeTva?: ValeurDe<typeof REGIME_TVA>;
  /** Le taux de cotisations URSSAF (%) de chaque nature de recette ; absent : le taux indicatif. */
  tauxUrssaf?: Partial<Record<ValeurDe<typeof NATURE_URSSAF>, number>>;
  /** Noms des sous-dossiers créés dans le dossier de chaque nouveau client (structure type, modifiable). */
  structureDossiers?: string[];
  /** Prix d'une chambre par nuit, en euros (gîte). */
  tarifNuit?: number;
  /** Prix d'un repas, en euros (gîte). */
  tarifRepas?: number;
  /** Le compte du plan comptable (classe 7) des recettes d'hébergement du gîte ; absent : celui d'office. */
  giteCompte?: string;
  /** Le taux de TVA (%) de l'hébergement du gîte ; absent : celui d'office. */
  giteTauxTva?: number;
  /** Vrai si l'établissement suit la taxe de séjour (gîte, hébergement). */
  taxeSejour?: boolean;
  /** Montant de la taxe de séjour ajouté à chaque réservation, en euros (montant fixe, quel que soit le séjour). */
  montantTaxeSejour?: number;
  /** Ancien format : montant par personne et par nuit, repris comme montant fixe (voir montantTaxeSejourDe). */
  taxeSejourParNuit?: number;
}

/** Le montant de la taxe de séjour d'une entreprise (celui d'avant le montant fixe est repris tel quel). */
export const montantTaxeSejourDe = (infos?: InfosEntreprise): number | undefined =>
  infos?.montantTaxeSejour ?? infos?.taxeSejourParNuit;

/** Coordonnées administratives de l'exploitation, affichées sur les rapports PDF. */
export interface InfosExploitation {
  /** Un titre propre à l'utilisateur, imprimé en tête de chaque PDF (nom commercial, adresse, mention…). */
  titrePdf?: string;
  /**
   * Vrai : le mode avancé. Absent ou faux, le mode simple cache ce qui demande des notions de comptabilité (comptes du plan
   * comptable, taux de TVA et nature URSSAF dans une nouvelle écriture) : les valeurs d'office s'appliquent. Propre à chaque
   * établissement ; sauvegardé avec ses informations.
   */
  /** Les rappels de déclaration que l'utilisateur a désactivés (voir GENRE_RAPPEL). */
  rappelsDesactives?: string[];
  /**
   * Le paramétrage du cheptel : les coefficients UGB choisis par espèce (à défaut ceux d'UGB_PAR_DEFAUT) et, pour chaque prime
   * (PRIMES), si elle compte dans la prime prévisionnelle, son taux en euros et ce sur quoi il s'applique (par UGB, par animal ou par hectare ; à défaut, la base d'office de la prime) ; `nom` renomme une aide d'office.
   * Les plafonds d'une aide (`plafond`, `minimum`, `plafondTaux`, `partFixe`, `tranchesZone`) remplacent ceux d'office (REGLES_PRIMES) ; 0 veut dire « sans ».
   */
  ugbPrimes?: ReglagesAides & {
    coefficients?: Partial<Record<EspeceAnimale, { adulte?: number; petit?: number }>>;
    /**
     * Les aides propres à une année et à une espèce (« 2026:chevres »), car les montants changent chaque année : à défaut, ceux de l'année
     * précédente la plus proche de la même espèce, puis les réglages d'avant (ceux ci-dessus, qui s'appliquent à toute année).
     */
    parAnnee?: Record<string, ReglagesAides>;
    /**
     * L'effectif déclaré (à la PAC) d'une année et d'une espèce (« 2026:chevres ») : l'UGB et les primes prévisionnels s'en servent
     * quand il est saisi, à défaut l'effectif de fin d'année. Il ne se reprend pas d'une année à l'autre.
     */
    effectifsDeclares?: Record<string, number>;
    /**
     * Le stabilisateur (%) du paiement de base (DPB) d'une année (« 2025 ») : le paiement perçu est la valeur calculée multipliée par ce
     * coefficient ; à défaut, celui d'office de l'année (STABILISATEUR_DPB_PAR_ANNEE).
     */
    stabilisateurs?: Record<string, number>;
    /**
     * La « réduction pour plafonnement budgétaire » (%) du paiement de base d'une année (« 2025 ») : elle n'est pas appliquée chaque
     * année ; quand elle l'est, c'est la plus élevée des deux réductions (celle-ci ou celle du stabilisateur) qui s'applique. À défaut,
     * celle d'office de l'année (REDUCTION_BUDGETAIRE_DPB_PAR_ANNEE) ; 0 : aucune.
     */
    reductionsBudgetaires?: Record<string, number>;
  };
  /** La trésorerie : le solde du compte à une date (le départ des courbes), le seuil sous lequel alerter, et les emprunts en cours. */
  tresorerie?: ReglagesTresorerie;
  emprunts?: Emprunt[];
  /** Le régime de TVA et sa périodicité (voir shared/constants/tva) : à défaut, le réel simplifié, mois par mois. */
  tva?: ReglagesTva;
  /** Faux : l'inventaire des boucles ne se synchronise plus avec le cheptel (poses et numéros). Absent : synchronisé. */
  synchroBoucles?: boolean;
  /** Les taux par produit : la TVA proposée pour chaque vente de production, l'imposition proposée pour chaque type d'aide. */
  tauxParProduit?: TauxParProduit;
  /** Les listes de valeurs que l'utilisateur tient (motifs de visite, codes de culture) : à défaut, celles d'origine. */
  listes?: Partial<Record<ValeurDe<typeof CLE_LISTE_PERSONNALISEE>, string[]>>;
  /** Les catégories de client de l'établissement (celles d'office à défaut) : voir dictionnaire/categoriesClient. */
  categoriesClient?: CategorieClientReglage[];
  /** Les catégories de fournisseur (de tiers) de l'établissement (celles d'office à défaut) : voir dictionnaire/categoriesFournisseur. */
  categoriesFournisseur?: CategorieFournisseurReglage[];
  /** Les rappels déjà validés (« rsa:2026-T3 », « urssaf:2026-09 »). */
  rappelsValides?: string[];
  /**
   * Le fichier de la déclaration à la Chambre d'agriculture jointe au bilan annuel, par année et par espèce (« 2025:chevres »).
   * Les premières versions rangeaient une liste de fichiers : les deux formes se lisent (voir piecesDeLaDeclaration).
   */
  declarationsChambre?: Record<string, PieceJointe | PieceJointe[]>;
  numeroExploitation?: string;
  siret?: string;
  nomExploitant?: string;
  adresseExploitant?: string;
  numeroPacage?: string;
  numeroDetenteur?: string;
  /** Informations de l'entreprise, pour un établissement qui n'est pas un élevage. */
  entreprise?: InfosEntreprise;
  /** Identification propre à chaque espèce élevée (n° de cheptel et indicatif de marquage diffèrent d'une espèce à l'autre). */
  cheptels?: Partial<Record<EspeceAnimale, IdentificationCheptel>>;
  /** Anciens champs uniques (avant la séparation par espèce) : ils valent pour toute espèce sans identification propre. */
  numeroCheptel?: string;
  indicatifMarquage?: string;
}

/** Vrai quand l'inventaire des boucles se synchronise avec le cheptel (d'office). */
export const synchroBouclesActive = (infos: InfosExploitation | undefined): boolean =>
  infos?.synchroBoucles !== false;

/** Identification du cheptel d'une espèce : la sienne si elle est renseignée, sinon l'ancien champ unique. */
export function identificationCheptel(
  infos: InfosExploitation | undefined,
  espece: EspeceAnimale,
): IdentificationCheptel {
  const propre = infos?.cheptels?.[espece];
  if (propre) return propre;
  return { numeroCheptel: infos?.numeroCheptel, indicatifMarquage: infos?.indicatifMarquage };
}

/** L'indicatif de marquage à faire précéder les numéros de boucle d'une espèce (rien s'il n'est pas renseigné). */
export const indicatifMarquagePar =
  (infos: InfosExploitation | undefined) =>
  (espece: EspeceAnimale): string | undefined =>
    identificationCheptel(infos, espece).indicatifMarquage?.trim() || undefined;

export interface AppSettings {
  /** L'année active ; quand « Tout » est choisi (toutesAnnees), c'est l'année en cours (partout où une année précise est nécessaire). */
  anneeActive: number;
  /** Vrai quand « Tout » est choisi : les listes regroupent toutes les années. */
  toutesAnnees?: boolean;
  driveFolderId?: string;
  driveFolderName?: string;
  driveAccountEmail?: string;
  derniereSynchronisation?: string; // ISO datetime
  exploitation?: InfosExploitation;
}

const DEFAULTS: AppSettings = {
  anneeActive: currentYear(),
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(cle());
  let reglages: AppSettings = { ...DEFAULTS };
  if (raw) {
    try {
      reglages = { ...DEFAULTS, ...(JSON.parse(raw) as AppSettings) };
    } catch {
      // Des réglages illisibles : ceux d'office.
    }
  }
  // Les catégories de client servent hors des écrans (calcul d'une vente) : elles sont posées à chaque lecture des réglages.
  definirCategoriesClient(reglages.exploitation?.categoriesClient);
  definirCategoriesFournisseur(reglages.exploitation?.categoriesFournisseur);
  definirTauxParProduit(reglages.exploitation?.tauxParProduit);
  return reglages;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(cle(), JSON.stringify(next));
  definirCategoriesClient(next.exploitation?.categoriesClient);
  definirCategoriesFournisseur(next.exploitation?.categoriesFournisseur);
  definirTauxParProduit(next.exploitation?.tauxParProduit);
  return next;
}

/** Les fichiers d'une déclaration à la Chambre, qu'elle soit rangée comme un fichier ou comme une liste (ancien format). */
export const piecesDeLaDeclaration = (valeur: PieceJointe | PieceJointe[] | undefined): PieceJointe[] =>
  Array.isArray(valeur) ? valeur : valeur ? [valeur] : [];
