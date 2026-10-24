import type { Ionicons } from '@expo/vector-icons';
import { SEXE } from '@/shared/constants/cheptel';
import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { CATEGORIE_FOURNISSEUR, CATEGORIES_ASSOCIATION } from '@/shared/constants/fournisseurs';
import { FAMILLE_CONTROLE, ONGLET_SANTE } from '@/shared/constants/controles';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
import { ROUTES } from '@/shared/constants/routes';
import { VOLET_COOPERATIVE } from '@/shared/constants/comptabilite';
import { SECTION_STOCK } from '@/shared/constants/stock';
import { lienPourCategories } from '@/features/commercial/services/categoriesDuLien';

/**
 * Les lieux de la carte de la ferme qui ont un tiers (un fournisseur, un client ou un organisme) : chacun a sa page — les contacts du
 * lieu, les factures qui le concernent, et les rubriques de l'application qui s'y rattachent. Ici la configuration, sans rien d'affichage ;
 * les textes sont dans `TEXTES.production.lieux`.
 */
export type CleLieuTiers =
  | 'aliments'
  | 'carburant'
  | 'garage'
  | 'assurance'
  | 'banque'
  | 'groupement'
  | 'groupementSanitaire'
  | 'emballages'
  | 'particuliers'
  | 'surfacesCommerciales'
  | 'entreprises'
  | 'visiteurs'
  | 'groupesVisiteurs'
  | 'tourisme'
  | 'repas'
  | 'cheptel'
  | 'documents'
  | 'analyses'
  | 'veterinaire'
  | 'organismes'
  | 'equarrissage'
  | 'abattoir'
  | 'boucherie'
  | 'entrepot'
  | 'commercial';

export interface LienDuLieu {
  /** La clé de ses textes (`TEXTES.production.lieux[lieu].liens[cle]`). */
  cle: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
}

export interface ConfigLieuTiers {
  cle: CleLieuTiers;
  /** Son dessin sur la carte (un emoji). */
  emoji: string;
  /** Faux pour un lieu sans tiers (l'entrepôt : que des rubriques) : ni contacts ni écritures sur sa page. */
  avecTiers: boolean;
  /** Les identifiants de catégories de contact dont les fiches sont les tiers du lieu. */
  categoriesContact: readonly string[];
  /** Les écritures du lieu : les factures de ces catégories (dépense ou recette), les ventes de ces catégories, et celles de ses tiers. */
  categoriesFacture: readonly string[];
  categoriesVente: readonly string[];
  /** Une recette que le lieu propose en plus (un versement reçu du groupement sanitaire) : sa catégorie de recette ; la page ajoute « Nouveau versement ». */
  recetteDuLieu?: string;
  /** Vrai : la nouvelle écriture du lieu s'ouvre avec le premier contact du lieu déjà choisi (le groupement sanitaire : le GDS). */
  contactParDefaut?: boolean;
  /** Les volets du lieu (une association ou une coopérative agricole) : chacun liste ses écritures et ouvre sa nouvelle écriture, avec son volet déjà choisi. */
  volets?: readonly { cle: string; route: string }[];
  /** Où ouvrir « Nouvelle facture » : une facture reçue (achat) ou émise (vente), déjà dans la bonne catégorie. */
  nouvelle: string;
  /** Vrai : la page montre les déclarations (recensement, estive) et les terrains en toutes lettres, à la place des liens. */
  dossierPac?: boolean;
  /** Vrai : la page montre le suivi des mouvements (à générer) et les documents déjà générés, avec ses liens (le registre de l'élevage). */
  registre?: boolean;
  liens: readonly LienDuLieu[];
}

const NOUVELLE = ROUTES.COMPTABILITE_NOUVELLE;
const stock = (section: string) => `${ROUTES.COMPTABILITE_STOCKS}?onglet=${section}`;

/** Les rubriques du commerce d'une catégorie de clients : le chiffre d'affaires, les commandes et la grille de tarifs ne montrent que les contacts de ces catégories. */
const liensDesClients = (categories: readonly string[] = []): readonly LienDuLieu[] => [
  { cle: 'ventes', icone: 'cash', route: lienPourCategories(ROUTES.COMMERCIAL_VENTES, categories) },
  { cle: 'commandes', icone: 'receipt', route: lienPourCategories(ROUTES.COMMERCIAL_COMMANDES, categories) },
  { cle: 'tarifs', icone: 'pricetag', route: lienPourCategories(ROUTES.COMMERCIAL_TARIFS, categories) },
  { cle: 'circuits', icone: 'navigate', route: ROUTES.COMMERCIAL_CIRCUITS },
];
const LIENS_DES_CLIENTS = liensDesClients();

/** Les rubriques de l'agritourisme que proposent les fiches de ses visiteurs : les visites, une nouvelle visite, les formules. */
const LIENS_DE_LAGRITOURISME: readonly LienDuLieu[] = [
  { cle: 'visites', icone: 'trail-sign', route: ROUTES.COMMERCIAL_AGRITOURISME },
  { cle: 'nouvelleVisite', icone: 'add-circle', route: ROUTES.COMMERCIAL_VISITE },
  { cle: 'formules', icone: 'list', route: ROUTES.COMMERCIAL_FORMULES },
];

export const LIEUX_TIERS: Record<CleLieuTiers, ConfigLieuTiers> = {
  aliments: {
    cle: 'aliments',
    avecTiers: true,
    emoji: '🌾🌽',
    categoriesContact: [CATEGORIE_FOURNISSEUR.ALIMENTS],
    categoriesFacture: [CATEGORIE_DEPENSE.ALIMENTATION],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.ALIMENTATION}`,
    liens: [
      { cle: 'stock', icone: 'cube', route: stock(SECTION_STOCK.ALIMENTS) },
      { cle: 'alimentation', icone: 'nutrition', route: ROUTES.SANTE_ALIMENTATION },
    ],
  },
  carburant: {
    cle: 'carburant',
    avecTiers: true,
    emoji: '⛽',
    categoriesContact: [CATEGORIE_FOURNISSEUR.CARBURANT],
    categoriesFacture: [CATEGORIE_DEPENSE.CARBURANT],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.CARBURANT}`,
    liens: [],
  },
  garage: {
    cle: 'garage',
    avecTiers: true,
    emoji: '🔧',
    categoriesContact: [CATEGORIE_FOURNISSEUR.GARAGE],
    categoriesFacture: [CATEGORIE_DEPENSE.REPARATION],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.REPARATION}`,
    // Les véhicules de l'exploitation : leurs informations, leur assurance et leurs réparations.
    liens: [{ cle: 'flotte', icone: 'car', route: ROUTES.FLOTTE }],
  },
  assurance: {
    cle: 'assurance',
    avecTiers: true,
    emoji: '🛡️',
    categoriesContact: [CATEGORIE_FOURNISSEUR.ASSUREUR],
    categoriesFacture: [CATEGORIE_DEPENSE.ASSURANCES],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.ASSURANCES}`,
    // L'échéancier facultatif des primes (case « Activer l'échéancier » et contrats), dans les réglages de la trésorerie.
    liens: [{ cle: 'echeancier', icone: 'calendar', route: ROUTES.COMPTABILITE_TRESORERIE_REGLAGES }],
  },
  banque: {
    cle: 'banque',
    avecTiers: true,
    emoji: '🏦',
    categoriesContact: [CATEGORIE_FOURNISSEUR.BANQUE, CATEGORIE_FOURNISSEUR.COMPTABLE],
    categoriesFacture: [CATEGORIE_DEPENSE.FRAIS_BANCAIRES],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.FRAIS_BANCAIRES}`,
    // Ce qu'on regarde avec sa banque : la trésorerie, la TVA et le plan comptable (les mêmes écrans que la Comptabilité).
    liens: [
      { cle: 'tresorerie', icone: 'wallet', route: ROUTES.COMPTABILITE_TRESORERIE },
      { cle: 'tva', icone: 'calculator', route: ROUTES.TVA },
      { cle: 'comptes', icone: 'list', route: ROUTES.COMPTES_PCG },
    ],
  },
  // Un groupement n'a pas de dépense propre (cotisation, achat groupé…) : ses écritures sont celles qui portent son nom.
  groupement: {
    cle: 'groupement',
    avecTiers: true,
    emoji: '🤝',
    categoriesContact: CATEGORIES_ASSOCIATION,
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.AUTRE}`,
    // Les cinq volets : une dépense chacun (c'est la catégorie de la dépense qui dit ce qu'on a acheté), sauf la vente groupée, une recette.
    volets: [
      { cle: VOLET_COOPERATIVE.ACHAT_GROUPE, route: `${NOUVELLE}?type=recue&volet=${VOLET_COOPERATIVE.ACHAT_GROUPE}` },
      { cle: VOLET_COOPERATIVE.VENTE_GROUPEE, route: `${NOUVELLE}?type=emise&volet=${VOLET_COOPERATIVE.VENTE_GROUPEE}` },
      { cle: VOLET_COOPERATIVE.MUTUALISATION, route: `${NOUVELLE}?type=recue&volet=${VOLET_COOPERATIVE.MUTUALISATION}&depense=${CATEGORIE_DEPENSE.AUTRE}` },
      { cle: VOLET_COOPERATIVE.EXPERTS, route: `${NOUVELLE}?type=recue&volet=${VOLET_COOPERATIVE.EXPERTS}&depense=${CATEGORIE_DEPENSE.AUTRE}` },
      { cle: VOLET_COOPERATIVE.TRANSPORTS, route: `${NOUVELLE}?type=recue&volet=${VOLET_COOPERATIVE.TRANSPORTS}&depense=${CATEGORIE_DEPENSE.AUTRE}` },
    ],
    // Les courriers, démarches et aides se rangent dans les dossiers de la fiche de chaque association ou coopérative.
    liens: [],
  },
  groupementSanitaire: {
    cle: 'groupementSanitaire',
    avecTiers: true,
    emoji: '🛡️🐐',
    categoriesContact: [CATEGORIE_FOURNISSEUR.GROUPEMENT_SANITAIRE],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.AUTRE}`,
    // Les cotisations (une dépense) et les versements reçus (une recette « Groupement sanitaire (GDS) ») se font avec le GDS déjà choisi.
    contactParDefaut: true,
    recetteDuLieu: CATEGORIE_RECETTE.GROUPEMENT_SANITAIRE,
    liens: [
      // Les traitements et les analyses du lait sont ceux du vétérinaire (les traitements) et de la laiterie (la qualité du lait) : les mêmes écrans.
      // Les traitements et les rapports d'essais sont avec les visites du vétérinaire (ses factures) : une seule entrée.
      // Les visites du vétérinaire sont celles de ses factures : la même liste que l'onglet Santé des contrôles, qui existe ainsi aussi ici.
      { cle: 'visites', icone: 'medical', route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, ONGLET_SANTE) },
      { cle: 'documents', icone: 'document-text', route: ROUTES.DOCUMENTS_GDS },
      { cle: 'analyses', icone: 'flask', route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER) },
      { cle: 'avortements', icone: 'alert-circle', route: ROUTES.lotsDeLaCategorie(CATEGORIE_LOT.AVORTEMENT) },
    ],
  },
  emballages: {
    cle: 'emballages',
    avecTiers: true,
    emoji: '📦',
    categoriesContact: [CATEGORIE_FOURNISSEUR.EMBALLAGES],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.PRODUCTION}`,
    liens: [
      { cle: 'stock', icone: 'cube', route: stock(SECTION_STOCK.EMBALLAGES) },
      // Les emballages consommés à chaque fromage vendu : un réglage de l'inventaire.
      { cle: 'conditionnement', icone: 'options', route: ROUTES.COMPTABILITE_CONDITIONNEMENT },
    ],
  },
  // Les clients du travail du produit, une fiche par catégorie : leurs contacts, et les rubriques du commerce (ventes, commandes, tarifs, circuits).
  particuliers: {
    cle: 'particuliers',
    avecTiers: true,
    emoji: '🧑',
    categoriesContact: [CATEGORIE_CLIENT.PARTICULIER],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise`,
    liens: liensDesClients([CATEGORIE_CLIENT.PARTICULIER]),
  },
  surfacesCommerciales: {
    cle: 'surfacesCommerciales',
    avecTiers: true,
    emoji: '🏬',
    categoriesContact: [CATEGORIE_CLIENT.SURFACE_COMMERCIALE],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise`,
    liens: liensDesClients([CATEGORIE_CLIENT.SURFACE_COMMERCIALE]),
  },
  entreprises: {
    cle: 'entreprises',
    avecTiers: true,
    emoji: '🏢',
    // Les entreprises et les surfaces commerciales ne font qu'une page sur l'accueil de l'atelier.
    categoriesContact: [CATEGORIE_CLIENT.ENTREPRISE, CATEGORIE_CLIENT.SURFACE_COMMERCIALE],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise`,
    liens: liensDesClients([CATEGORIE_CLIENT.ENTREPRISE, CATEGORIE_CLIENT.SURFACE_COMMERCIALE]),
  },
  // L'agritourisme : les clients qui visitent la ferme (visiteurs, groupes), et ses fournisseurs (l'office de tourisme qui envoie des visiteurs, le repas).
  visiteurs: {
    cle: 'visiteurs',
    avecTiers: true,
    emoji: '🧳',
    categoriesContact: [CATEGORIE_CLIENT.VISITEUR],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise`,
    liens: LIENS_DE_LAGRITOURISME,
  },
  groupesVisiteurs: {
    cle: 'groupesVisiteurs',
    avecTiers: true,
    emoji: '🚌',
    categoriesContact: [CATEGORIE_CLIENT.GROUPE_VISITEURS],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise`,
    liens: LIENS_DE_LAGRITOURISME,
  },
  tourisme: {
    cle: 'tourisme',
    avecTiers: true,
    emoji: '🧭',
    categoriesContact: [CATEGORIE_FOURNISSEUR.TOURISME],
    categoriesFacture: [],
    categoriesVente: [],
    // Les factures de l'office de tourisme et des partenaires sont des frais touristiques : la nouvelle facture arrive déjà rangée dans l'atelier Agritourisme.
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.AUTRE}&atelier=agritourisme`,
    liens: [],
  },
  repas: {
    cle: 'repas',
    avecTiers: true,
    emoji: '🍽️',
    categoriesContact: [CATEGORIE_FOURNISSEUR.REPAS],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.PRODUCTION}`,
    liens: [],
  },
  // Les deux pages de l'intérieur de l'exploitation qui ne sont que des rubriques (sans tiers) : le cheptel (les animaux, les ajouts) et les documents.
  cheptel: {
    cle: 'cheptel',
    avecTiers: false,
    emoji: '🐐',
    categoriesContact: [],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: NOUVELLE,
    liens: [
      { cle: 'liste', icone: 'list', route: ROUTES.lieu('animaux') },
      { cle: 'lots', icone: 'layers', route: ROUTES.CHEPTEL_LOTS },
      { cle: 'male', icone: 'male', route: `${ROUTES.CHEPTEL_NOUVELLE}?sexe=${SEXE.MALE}` },
      { cle: 'femelle', icone: 'female', route: `${ROUTES.CHEPTEL_NOUVELLE}?sexe=${SEXE.FEMELLE}` },
      { cle: 'petit', icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE },
    ],
  },
  documents: {
    cle: 'documents',
    avecTiers: false,
    emoji: '📄',
    categoriesContact: [],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: NOUVELLE,
    // Le registre de l'élevage : le carnet de naissance, le suivi des mouvements (le PDF), le bordereau de perte, les documents de circulation et d'identification.
    registre: true,
    liens: [
      { cle: 'carnet', icone: 'book', route: ROUTES.CHEPTEL_NAISSANCES },
      { cle: 'circulation', icone: 'paper-plane', route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION },
      { cle: 'identification', icone: 'card', route: ROUTES.DOCUMENTS_IDENTIFICATION },
      // Les boucles : la liste à imprimer et le stock de boucles (ils ne sont plus dans le cheptel).
      { cle: 'boucles', icone: 'pricetag', route: ROUTES.lieu('boucles') },
      { cle: 'historique', icone: 'time', route: ROUTES.CHEPTEL_HISTORIQUE },
    ],
  },
  // Les analyses : celles du lait (la qualité du lait), du fromage et de la charcuterie (les autocontrôles de la ferme).
  analyses: {
    cle: 'analyses',
    avecTiers: false,
    emoji: '🔬',
    categoriesContact: [],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: NOUVELLE,
    liens: [
      { cle: 'lait', icone: 'flask', route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER) },
      { cle: 'fromage', icone: 'flask-outline', route: ROUTES.analysesProduit('fromage') },
      { cle: 'charcuterie', icone: 'flask-outline', route: ROUTES.analysesProduit('charcuterie') },
      { cle: 'plat', icone: 'flask-outline', route: ROUTES.analysesProduit('plat') },
      { cle: 'savon', icone: 'flask-outline', route: ROUTES.analysesProduit('savon') },
      { cle: 'registre', icone: 'journal', route: ROUTES.PRODUCTION_REGISTRE_ANALYSES },
    ],
  },
  veterinaire: {
    cle: 'veterinaire',
    avecTiers: true,
    emoji: '🩺',
    categoriesContact: [CATEGORIE_FOURNISSEUR.VETERINAIRE],
    categoriesFacture: [CATEGORIE_DEPENSE.VETERINAIRE],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.VETERINAIRE}`,
    // Les traitements et les rapports d'essais, que le vétérinaire donne ou fait faire à son intervention, sont avec ses visites (et les mêmes que ceux du groupement sanitaire).
    liens: [
      { cle: 'visites', icone: 'medical', route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, ONGLET_SANTE) },
    ],
  },
  organismes: {
    cle: 'organismes',
    avecTiers: true,
    emoji: '🏛️',
    categoriesContact: [
      CATEGORIE_FOURNISSEUR.ORGANISME,
      CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE,
      // L'État (DDPP, DGCCRF, impôts…) est rangé avec les organismes.
      CATEGORIE_FOURNISSEUR.ETAT,
      CATEGORIE_CLIENT.ORGANISME,
    ],
    categoriesFacture: [CATEGORIE_RECETTE.AIDE],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.AIDE}`,
    // Les déclarations (recensement annuel, déclaration d'estive) et les terrains s'affichent dans la page même.
    dossierPac: true,
    liens: [],
  },
  equarrissage: {
    cle: 'equarrissage',
    avecTiers: true,
    emoji: '🚛',
    categoriesContact: [CATEGORIE_FOURNISSEUR.EQUARRISSAGE],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.AUTRE}`,
    // Le bon d'équarrissage est rangé dans le lot d'équarrissage (Lots d'animaux), avec ses animaux.
    // Les bons d'enlèvement sont dans la page elle-même (un groupe en tête), pas derrière un lien.
    liens: [],
  },
  abattoir: {
    cle: 'abattoir',
    avecTiers: true,
    emoji: '🏭',
    categoriesContact: [CATEGORIE_FOURNISSEUR.ABATTOIR],
    categoriesFacture: [CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE],
    // Les viandes vendues (aux clients) n'y sont pas : seules les factures qui passent par l'abattoir (celles de ses contacts et de sa catégorie) y figurent.
    categoriesVente: [],
    // Une nouvelle facture de l'abattoir (une dépense) ; la vente de viande se fait dans l'Atelier.
    nouvelle: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE}&abattoirContact=1`,
    // La vente de viande (lots à facturer, stock) se fait dans l'Atelier : cette page ne montre que les abattoirs et leurs écritures.
    liens: [],
  },
  boucherie: {
    cle: 'boucherie',
    avecTiers: true,
    emoji: '🥩',
    categoriesContact: [],
    categoriesFacture: [],
    categoriesVente: [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE],
    nouvelle: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE}`,
    liens: [
      { cle: 'stock', icone: 'cube', route: stock(SECTION_STOCK.VIANDE) },
      { cle: 'charcuterie', icone: 'restaurant', route: ROUTES.PRODUCTION_CHARCUTERIE },
      { cle: 'fabrication', icone: 'flask', route: ROUTES.productionFabrication('charcuterie') },
      { cle: 'rappels', icone: 'notifications', route: ROUTES.PRODUCTION_RAPPELS_LOTS },
    ],
  },
  entrepot: {
    cle: 'entrepot',
    avecTiers: false,
    emoji: '📦',
    categoriesContact: [],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: NOUVELLE,
    liens: [
      { cle: 'tout', icone: 'cube', route: ROUTES.COMPTABILITE_STOCKS },
      { cle: 'aliments', icone: 'nutrition', route: stock(SECTION_STOCK.ALIMENTS) },
      { cle: 'fromages', icone: 'restaurant', route: stock(SECTION_STOCK.FROMAGES) },
      { cle: 'lait', icone: 'water', route: stock(SECTION_STOCK.LAIT) },
      { cle: 'viande', icone: 'restaurant', route: stock(SECTION_STOCK.VIANDE) },
      { cle: 'boucles', icone: 'pricetag', route: stock(SECTION_STOCK.BOUCLES) },
      { cle: 'emballages', icone: 'cube', route: stock(SECTION_STOCK.EMBALLAGES) },
      { cle: 'equipement', icone: 'construct', route: stock(SECTION_STOCK.EQUIPEMENT) },
      { cle: 'historique', icone: 'time', route: ROUTES.stockHistorique() },
    ],
  },
  commercial: {
    cle: 'commercial',
    avecTiers: true,
    emoji: '🛒',
    categoriesContact: [CATEGORIE_CLIENT.PARTICULIER, CATEGORIE_CLIENT.ENTREPRISE],
    categoriesFacture: [],
    categoriesVente: [],
    nouvelle: `${NOUVELLE}?type=emise`,
    liens: [
      { cle: 'ventes', icone: 'cash', route: ROUTES.COMMERCIAL_VENTES },
      { cle: 'commandes', icone: 'receipt', route: ROUTES.COMMERCIAL_COMMANDES },
      { cle: 'tarifs', icone: 'pricetag', route: ROUTES.COMMERCIAL_TARIFS },
      { cle: 'circuits', icone: 'navigate', route: ROUTES.COMMERCIAL_CIRCUITS },
    ],
  },
};

export const estLieuTiers = (cle: string | undefined): cle is CleLieuTiers => !!cle && cle in LIEUX_TIERS;

/** Les écritures d'un lieu : celles de ses catégories (factures ou ventes) et celles de ses tiers (le nom du tiers sur l'écriture). */
export function ecrituresDuLieu<T extends { titre: string; categorie?: string; libelleCategorie?: string }>(
  config: Pick<ConfigLieuTiers, 'categoriesFacture' | 'categoriesVente'>,
  ecritures: readonly T[],
  nomsDesTiers: readonly string[],
  libelleDeVente: (categorie: string) => string,
): T[] {
  const noms = new Set(nomsDesTiers.map((n) => n.trim().toLowerCase()).filter(Boolean));
  const libellesDeVente = new Set(config.categoriesVente.map(libelleDeVente));
  return ecritures.filter(
    (e) =>
      (e.categorie !== undefined && config.categoriesFacture.includes(e.categorie)) ||
      (e.libelleCategorie !== undefined && libellesDeVente.has(e.libelleCategorie)) ||
      noms.has(e.titre.trim().toLowerCase()),
  );
}
