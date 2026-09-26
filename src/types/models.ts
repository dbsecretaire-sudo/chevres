export type Sexe = 'M' | 'F';

export type StatutChevre = 'vivante' | 'morte' | 'abattoir' | 'vendue' | 'autoconsommee' | 'mortne';

export interface Chevre {
  id: string;
  /** Facultatif : légalement obligatoire seulement à partir de 6 mois (l'animal n'est alors plus un cabrit). */
  numeroBoucle?: string;
  nom?: string;
  sexe: Sexe;
  dateNaissance: string; // YYYY-MM-DD
  mereId?: string;
  mereNumeroBoucle?: string;
  statut: StatutChevre;
  dateStatut?: string; // YYYY-MM-DD, présent quand statut !== 'vivante'
  /** Désigné(e) pour rester dans le troupeau reproducteur (indépendant du statut vivant/mort). */
  renouvellement?: boolean;
  notes?: string;
}

export interface VisiteVeterinaire {
  id: string;
  date: string;
  chevreId?: string;
  chevreNumeroBoucle?: string; // vide = troupeau entier
  motif: string;
  description?: string;
  cout?: number;
}

export type TypeFacture = 'recue' | 'emise';

/** Catégorie de dépense pour une facture reçue (achat). */
export type CategorieDepense =
  | 'alimentation'
  | 'carburant'
  | 'reparation'
  | 'veterinaire'
  | 'impots'
  | 'autre';

/** Catégorie de recette pour une facture émise (vente / aide). */
export type CategorieRecette = 'lait' | 'fromage' | 'cabris' | 'aide' | 'autre';

/**
 * Type d'aide agricole précis — utile pour s'y retrouver d'une année sur l'autre (chaque
 * ligne d'un relevé PAC correspond en général à l'une de ces catégories). Indiquez
 * l'organisme payeur (ODARC, ASP...) dans le champ "Client / organisme" de la facture.
 */
export type TypeAide =
  | 'paiement_base'
  | 'paiement_redistributif'
  | 'ecoregime'
  | 'petits_ruminants'
  | 'ichn'
  | 'autre';

export type TypeAliment = 'mais' | 'luzerne' | 'foin' | 'paille' | 'autre';

export type TypeCarburant = 'gazoil' | 'essence' | 'gnr';

export interface LigneAlimentation {
  type: TypeAliment;
  montant: number;
  /** Quantité en kg, facultative — utile pour calculer le kg par animal en plus du coût. */
  quantiteKg?: number;
  /** Précision libre quand type === 'autre' (ex: "Frais de livraison", "Compléments minéraux"). */
  typeLibre?: string;
}

export interface Facture {
  id: string;
  date: string;
  type: TypeFacture;
  tiers: string; // fournisseur ou client
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
  /** Uniquement pour categorieDepense === 'carburant' : utile pour les aides calculées au litre (ex: GNR). */
  litrage?: number;
  /** Uniquement pour categorieDepense === 'carburant' : certaines aides (ex: GNR) ne concernent qu'un type précis. */
  typeCarburant?: TypeCarburant;
  /**
   * Uniquement pour categorieDepense === 'autre' ou categorieRecette === 'autre' : n° de compte PCG
   * choisi manuellement (les autres catégories ont un compte fixe, voir planComptable.ts).
   */
  compteManuel?: string;
  /** Uniquement pour type === 'recue' : taux de TVA (%) indiqué sur la facture d'achat, tel quel. */
  tauxTva?: number;
}

export type CategorieVente = 'lait' | 'fromage' | 'cabris';
export type TypeFromage = 'frais' | 'affine' | 'crottin' | 'brocciu' | 'autre';
export type UniteVente = 'litres' | 'piece' | 'kg';

export interface Vente {
  id: string;
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
}

export interface Controle {
  id: string;
  date: string;
  chevreId?: string;
  chevreNumeroBoucle?: string; // vide = troupeau entier
  type: string;
  resultat?: string;
  notes?: string;
}

/** Fiche fournisseur, réutilisable pour préremplir le tiers d'une facture reçue (achat). */
export interface Fournisseur {
  id: string;
  nom: string;
  prenom?: string;
  nomEntreprise: string;
  siret: string;
  /** Numéro de TVA intracommunautaire — facultatif (ex : fournisseur en franchise en base). */
  tva?: string;
  rib: string;
  adressePostale: string;
}

export type Categorie =
  | 'cheptel'
  | 'ventes'
  | 'factures'
  | 'visites_veterinaire'
  | 'controles';

export interface RecordMap {
  cheptel: Chevre;
  ventes: Vente;
  factures: Facture;
  visites_veterinaire: VisiteVeterinaire;
  controles: Controle;
}
