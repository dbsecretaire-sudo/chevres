import AsyncStorage from '@react-native-async-storage/async-storage';
import type { INVESTISSEMENT } from '@/shared/constants/economies';
import { currentYear } from '@/shared/utils/dates';
import { cleStockage } from '@/features/etablissements/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import type { PieceJointe } from '@/features/fichiers/types';
import type { DocumentCirculationDepose } from '@/features/comptabilite/types';
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

/** La périodicité de la prime d'un contrat d'assurance. */
export type PeriodiciteAssurance = 'mensuelle' | 'trimestrielle' | 'semestrielle' | 'annuelle';

/** Un contrat d'assurance de l'échéancier : sa prime (€), sa périodicité et sa prochaine échéance (AAAA-MM-JJ). */
export interface ContratAssurance {
  id: string;
  /** Ce que le contrat couvre, avec son assureur, quand il vient d'une proposition (voir propositionsDeContrats) : il n'est pas reproposé. */
  source?: string;
  nom: string;
  prime: number;
  periodicite: PeriodiciteAssurance;
  prochaineEcheance: string;
}

/** Le produit fini d'une analyse : le fromage, la charcuterie, un plat préparé ou un savon. */
export type ProduitAnalyse = 'fromage' | 'charcuterie' | 'plat' | 'savon';

/** Le résultat d'un paramètre d'une analyse : « absence » ou « presence » (recherche dans 25 g), ou un nombre d'UFC par gramme. */
export type ResultatParametre = 'absence' | 'presence' | number;

/** Une analyse d'un produit fini (autocontrôle microbiologique) : sa date, son laboratoire, ce qui a été analysé et les résultats, avec le rapport joint. */
export interface AnalyseProduit {
  id: string;
  produit: ProduitAnalyse;
  /** La date du prélèvement (AAAA-MM-JJ). */
  date: string;
  /** Le laboratoire : un contact de catégorie « Laboratoire » (absent : non précisé). */
  laboratoireId?: string;
  numeroRapport?: string;
  /** Le produit analysé (« Tomme au lait cru ») et son numéro de lot, facultatifs. */
  echantillon?: string;
  lot?: string;
  /** La fabrication analysée (l'identifiant du mouvement de stock de ses lots) : l'analyse se retrouve dans le registre, avec elle. */
  fabricationId?: string;
  /** Les résultats, par paramètre (voir PARAMETRES) ; un paramètre non analysé est absent. */
  resultats: Record<string, ResultatParametre>;
  /** Le rapport du laboratoire (PDF, photo, scan), rangé dans l'appareil. */
  fichiers?: PieceJointe[];
  notes?: string;
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
  /** L'ICHN par zone : le montant (€/ha) de chaque zone autre que la montagne sèche (`taux`) ; les hectares de chaque zone sont ceux des parcelles (Suivi des terrains). */
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

/** Une catégorie de lots d'animaux : son identifiant (celui que portent les lots) et son nom, que l'utilisateur peut changer. */
export interface CategorieLotReglage {
  id: string;
  nom: string;
}

/** Un lot d'animaux : un nom (« Chevrettes 2026 ») et les boucles des animaux, séparées par des virgules. Il désigne les mêmes animaux d'un geste. */
/** Pourquoi une bête d'un lot d'abattage n'est pas consommable : un problème sanitaire, ou sa mort pendant le transport. */
export type MotifInconsommable = 'sanitaire' | 'transport';

/** Une bête d'un lot d'abattage déclarée inconsommable. */
export interface InconsommableDuLot {
  /** L'identifiant de sa fiche du cheptel. */
  id: string;
  motif: MotifInconsommable;
}

export interface LotAnimaux {
  id: string;
  nom: string;
  boucles: string;
  /** Un lot d'avortements : le nombre d'avortements de l'année de chaque femelle, par boucle (absent pour une boucle du lot : un seul). */
  avortements?: Record<string, number>;
  /** Un lot d'abattoir : le jour d'abattage de ses animaux (AAAA-MM-JJ). Il se crée et se tient à jour tout seul d'après le cheptel. */
  abattoir?: string;
  /** La catégorie du lot (voir CATEGORIE_LOT, ou une catégorie ajoutée) ; absente : « Autres lots ». */
  categorie?: string;
  /** Un lot de mises à la reproduction : l'année de ses mises bas. Un lot se crée tout seul chaque année (les femelles présentes au 1er janvier). */
  reproduction?: number;
  /** Un lot de mises à la reproduction : la version du calcul qui l'a rempli (les lots d'une version plus ancienne sont recalculés une fois). */
  versionCalcul?: number;
  /** Un lot d'avortements : l'année des avortements de ses femelles. */
  avortement?: number;
  /** Un lot de renouvellement : l'année de désignation de ses animaux (renouvellementAnnee de leur fiche, que le lot tient à jour). */
  renouvellement?: number;
  /** Un lot créé tout seul pour une visite vétérinaire : la visite (son nom et sa date la suivent). */
  visiteId?: string;
  /** Pour un lot d'abattoir : la facture (dépense) de l'abattoir qui le concerne ; son montant est proposé en frais refacturés au client. */
  factureId?: string;
  /** Sans facture liée : le montant que l'abattoir demande de payer (€ TTC), noté à la main. */
  fraisAbattoir?: number;
  /** Pour un lot d'abattoir : les bêtes déclarées inconsommables (saisie sanitaire, ou mortes pendant le transport) : elles ne se facturent pas au client. */
  inconsommables?: InconsommableDuLot[];
  /** Pour un lot d'abattoir : le poids de toute la viande du lot (kg) : il remplit le poids de la facture au client. */
  poidsKg?: number;
  /** Pour un lot d'abattoir : les fichiers de cet abattage ou de sa vente (poids, bon d'abattage, documents), joints à la fiche du lot. */
  fichiers?: PieceJointe[];
  /**
   * Un lot créé par le départ d'animaux vivants (l'assistant « Nouveau lot d'abattoir ») : il existe avant toute écriture, avec son document de
   * circulation, et ne disparaît pas avec sa facture (qui est émise quelques jours plus tard).
   */
  depart?: boolean;
  /** Un lot de départ d'animaux vendus vivants : le jour du départ (AAAA-MM-JJ). Un lot d'abattoir a le sien dans `abattoir`. */
  dateDepart?: string;
  /** Le contact du lot : l'équarrisseur d'un lot d'équarrissage, l'abattoir d'un lot d'abattoir (l'identifiant de sa fiche) ; le lot se range dans ses documents. */
  contactCle?: string;
  /** Un lot d'équarrissage : le numéro du bon d'équarrissage remis par l'équarrisseur (le scan du bon est dans `fichiers`) et le jour de l'enlèvement (AAAA-MM-JJ). */
  numeroBon?: string;
  dateEnlevement?: string;
  /** Le document de circulation du lot (un seul pour tout le lot) : le scan du document rempli ; absent tant qu'il manque. */
  documentCirculation?: DocumentCirculationDepose;
}

/**
 * Ce que l'utilisateur saisit d'une année de transhumance (la déclaration de montée et descente d'estive) : les dates (AAAA-MM-JJ), la zone
 * d'estive, et le gestionnaire de l'estive (l'entité collective) avec la commune de son siège.
 */
export interface ReglagesEstive {
  dateMontee?: string;
  dateDescente?: string;
  zone?: string;
  gestionnaire?: string;
  communeGestionnaire?: string;
  /** Vrai : l'utilisateur est lui-même le gestionnaire de l'estive (ses numéros remplissent le cadre de l'entité collective). */
  moiGestionnaire?: boolean;
}

/** Ce que l'utilisateur saisit d'une année de traite : les dates de début et de fin, et le nombre d'animaux à traire. */
export interface ReglagesTraite {
  debut?: string;
  fin?: string;
  chevres?: number;
}

/**
 * Ce que l'utilisateur indique d'un investissement du plan d'économies : son coût (pour le remboursement) et deux prix d'après devis —
 * la tonne de grain en sacs et en vrac pour un silo, le litre de gazole à la pompe et en cuve pour une cuve.
 */
export interface ReglageInvestissement {
  cout?: number;
  /** Le prix d'aujourd'hui : la tonne en sacs, ou le litre à la pompe. */
  prixActuel?: number;
  /** Le prix avec l'investissement : la tonne en vrac, ou le litre en cuve. */
  prixAvecInvestissement?: number;
}

/** Un élément de la fromagerie amorti dans la simulation du lait : son nom, son montant (€) et sa durée d'amortissement (années). */
export interface ElementAmortissement {
  id: string;
  libelle: string;
  montant?: number;
  duree?: number;
}

/** L'amortissement de la fromagerie dans la simulation : un montant unique ou le détail de ses éléments, inclus ou non. */
export interface ReglageAmortissementFromagerie {
  /** La fromagerie est incluse dans la simulation (et son PDF). */
  inclure?: boolean;
  /** Le détail par élément plutôt qu'un montant unique. */
  detaille?: boolean;
  montant?: number;
  duree?: number;
  elements?: ElementAmortissement[];
}

/** Un investissement lu dans les réglages (l'ancien format était le coût seul). */
export const reglageInvestissement = (
  valeur: ReglageInvestissement | number | undefined,
): ReglageInvestissement => (typeof valeur === 'number' ? { cout: valeur } : (valeur ?? {}));

/** Un document du groupement sanitaire déposé par l'éleveur : le fichier (scan, photo) et le moment du dépôt. */
export interface DocumentGdsDepose {
  piece: PieceJointe;
  /** Date et heure du dépôt (ISO). */
  deposeLe: string;
}

/** Ce que l'éleveur garde du groupement sanitaire : ses documents, plusieurs par rubrique (un seul document, ancien format, reste lisible). */
export interface ReglagesGds {
  documents?: Record<string, DocumentGdsDepose[] | DocumentGdsDepose>;
}

/** Coordonnées administratives de l'exploitation, affichées sur les rapports PDF. */
/** Un véhicule de la flotte : ce qu'il faut pour le reconnaître et commander des pièces (la carte grise), son verso en image, son statut. */
export interface Vehicule {
  id: string;
  /** La plaque d'immatriculation (champ A de la carte grise), en majuscules. */
  plaque: string;
  /** L'année de la première immatriculation (champ B). */
  anneeImmatriculation?: number;
  marque?: string;
  modele?: string;
  /** Le type, la variante, la version (champ D.2) : les pièces en dépendent. */
  version?: string;
  /** Le numéro de série du véhicule, le VIN (champ E) : c'est avec lui que les fournisseurs retrouvent les pièces. */
  numeroSerie?: string;
  /** L'énergie (champ P.3) : essence, diesel, électrique… */
  energie?: string;
  /** La cylindrée en cm³ (champ P.1) et la puissance en kW (champ P.2). */
  cylindree?: number;
  puissanceKw?: number;
  /** Le code moteur, quand on le connaît (il n'est pas sur la carte grise). */
  codeMoteur?: string;
  /** Le kilométrage relevé en dernier. */
  kilometrage?: number;
  /** Le verso du certificat d'immatriculation (une image ou un PDF). */
  certificat?: PieceJointe;
  /** La date où l'assurance du véhicule a été résiliée (AAAA-MM-JJ) : une prime payée après cette date le rend de nouveau assuré. */
  assuranceResilieeLe?: string;
  /** Faux : le véhicule n'est plus utilisé ; il reste consultable, avec son historique, mais n'est plus proposé dans les écritures. */
  actif: boolean;
  notes?: string;
}

export interface InfosExploitation {
  /** La flotte : les véhicules de l'exploitation. */
  flotte?: Vehicule[];
  /** Le groupement sanitaire : les documents déposés. */
  gds?: ReglagesGds;
  /** Mode avancé de Production › Viande : les onglets des animaux sans boucle vendus sans facture (à vendre, vendus morts ou vivants). */
  ventesSansFacture?: boolean;
  /** Vrai une fois faite la réparation des animaux de lots d'abattoir remis vivants par une ancienne version (elle ne se refait pas). */
  reparationLotsAbattoir?: boolean;
  /** Fait une fois : les animaux des ventes sans facture notés « morts » par l'ancienne règle sont devenus « vendus ». */
  reparationVentesSansFacture?: boolean;
  /** Les catégories de lots d'animaux ajoutées par l'utilisateur (Abattoir et Vétérinaire sont d'office). */
  categoriesLots?: string[];
  /** La liste des catégories de lots (noms et ordre) : celles d'office et celles de l'utilisateur. Absente : celles d'office, puis `categoriesLots`. */
  categoriesLotsListe?: CategorieLotReglage[];
  /** Un titre propre à l'utilisateur, imprimé en tête de chaque PDF (nom commercial, adresse, mention…). */
  titrePdf?: string;
  /**
   * Vrai : le mode avancé. Absent ou faux, le mode simple cache ce qui demande des notions de comptabilité (comptes du plan
   * comptable, taux de TVA et nature URSSAF dans une nouvelle écriture) : les valeurs d'office s'appliquent. Propre à chaque
   * établissement ; sauvegardé avec ses informations.
   */
  /** Les rappels de déclaration que l'utilisateur a désactivés (voir GENRE_RAPPEL). */
  rappelsDesactives?: string[];
  /** Vrai : le didacticiel est désactivé sur l'accueil (absent : activé). */
  didacticielMasque?: boolean;
  /** Vrai : l'accueil classique, en liste (absent : l'accueil « ferme », en images). */
  accueilClassique?: boolean;
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
  /**
   * La traite d'une année et d'une espèce (« 2026:chevres ») : les dates de début et de fin de traite et le nombre d'animaux à traire,
   * pour un lait par animal plus précis que celui déduit de l'inventaire. Ils ne se reprennent pas d'une année à l'autre.
   */
  traites?: Record<string, ReglagesTraite>;
  /** La transhumance d'une année (« 2026 ») : de quoi remplir la déclaration de montée et descente d'estive. */
  estives?: Record<string, ReglagesEstive>;
  /** Les lots d'animaux nommés : on les réutilise pour un traitement, une visite ou un contrôle, et on suit leur santé ensemble. */
  lots?: LotAnimaux[];
  /** La répartition du lait choisie dans le plan d'économies : la part (en %) du lait de l'année de chaque fromage, par identifiant d'article ; le reste est vendu tel quel. Absent : la répartition réelle. */
  repartitionLait?: Record<string, number>;
  /** Le brocciu fait partie de la répartition (fabriqué avec le petit-lait des autres fromages) : coché ou non. Absent : coché quand il a été fabriqué. */
  repartitionBrocciu?: boolean;
  /** L'amortissement de la fromagerie de la simulation du lait en fromage. */
  amortissementFromagerie?: ReglageAmortissementFromagerie;
  /** Les investissements du plan d'économies (silo à grain, cuve à gazole) : leur coût et les prix d'après devis (un nombre est l'ancien format : le coût seul). */
  investissementsEconomie?: Partial<Record<ValeurDe<typeof INVESTISSEMENT>, ReglageInvestissement | number>>;
  /** La trésorerie : le solde du compte à une date (le départ des courbes), le seuil sous lequel alerter, et les emprunts en cours. */
  tresorerie?: ReglagesTresorerie;
  emprunts?: Emprunt[];
  /** Vrai : les primes des contrats d'assurance à venir entrent dans l'échéancier et la prévision de la trésorerie (case « Activer l'échéancier »). */
  echeancierAssurance?: boolean;
  /** Les analyses des produits finis (fromage, charcuterie) : leurs résultats et leurs rapports. */
  analysesProduits?: AnalyseProduit[];
  contratsAssurance?: ContratAssurance[];
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
  /** Les jours entre deux analyses des plats préparés en stock (l'intervalle que demande la DDPP) : sans lui, aucun rappel d'analyse. */
  joursEntreAnalysesPlats?: number;
  /** Les jours entre deux analyses des savons en stock (l'intervalle que fixe l'évaluateur de la sécurité) : sans lui, aucun rappel d'analyse. */
  joursEntreAnalysesSavons?: number;
  /** Les rappels déjà validés (« rsa:2026-T3 », « urssaf:2026-09 »). */
  rappelsValides?: string[];
  /**
   * Le fichier de la déclaration à la Chambre d'agriculture jointe au bilan annuel, par année et par espèce (« 2025:chevres »).
   * Les premières versions rangeaient une liste de fichiers : les deux formes se lisent (voir piecesDeLaDeclaration).
   */
  declarationsChambre?: Record<string, PieceJointe | PieceJointe[]>;
  numeroExploitation?: string;
  siret?: string;
  /** La date d'installation de l'exploitant actuel (AAAA-MM-JJ) : les listes de repères imprimées séparent les boucles d'avant et d'après. */
  dateInstallation?: string;
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
