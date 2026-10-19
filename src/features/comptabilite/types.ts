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
  RUBRIQUE_MARCHANDISE,
  UNITE_MARCHANDISE,
  TYPE_CHOIX_FACTURE,
} from '@/shared/constants/comptabilite';
import type { NATURE_URSSAF } from '@/shared/constants/entreprise';
import type { PieceJointe } from '@/features/fichiers/types';

/** Le document de circulation déposé pour une vente ou une dépense d'animaux vivants : le fichier (scan, photo, PDF) et le moment du dépôt. */
export interface DocumentCirculationDepose {
  piece: PieceJointe;
  /** Date et heure du dépôt (ISO) : « Document ajouté le 18/10/2026 à 13:34 ». */
  deposeLe: string;
}

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
  /** Cheptel concerné quand il diffère de l'activité de la facture (voir activiteLigne). */
  activite?: ActiviteComptable;
  /** Quantité en kg, facultative — utile pour calculer le kg par animal en plus du coût. Pour luzerne/foin/paille, dérivée de nombreUnitesConditionnement × poids unitaire. */
  quantiteKg?: number;
  /** Précision libre quand type === 'autre' (ex: "Frais de livraison", "Compléments minéraux"). */
  typeLibre?: string;
  /** Uniquement pour type luzerne/foin/paille : conditionnement saisi (conservé pour ré-affichage lors de la modification). */
  uniteConditionnement?: UniteConditionnement;
  /** Uniquement pour type luzerne/foin/paille : nombre d'unités saisi (conservé pour ré-affichage lors de la modification). */
  nombreUnitesConditionnement?: number;
  /** Un matériel acheté sur la facture (choisi comme « Matériel » dans la liste des cheptels), pas un aliment. */
  materiel?: boolean;
  /** Un équipement (consommable : gants, filtres…) acheté sur la facture, pas un aliment. */
  equipement?: boolean;
  /** Offert par le fournisseur (cadeau) : la ligne compte 0 € ; sa quantité entre quand même au stock. */
  offert?: boolean;
}

/** Une marchandise achetée pour le gîte : celle du stock, la rubrique qu'elle sert, sa quantité et son montant TTC. */
export interface LigneMarchandise {
  marchandise: string;
  rubrique: ValeurDe<typeof RUBRIQUE_MARCHANDISE>;
  quantite?: number;
  unite?: ValeurDe<typeof UNITE_MARCHANDISE>;
  montant: number;
  /** Offert par le fournisseur (cadeau) : la ligne compte 0 € ; sa quantité entre quand même au stock. */
  offert?: boolean;
}

/** Une fourniture d'un achat de production : l'article de l'inventaire (voir cleArticle), sa quantité, son montant TTC et, pour des boucles, le numéro de la première. */
export interface LigneProduction {
  article: string;
  quantite?: number;
  montant: number;
  bouclesDebut?: string;
  /** Offert par le fournisseur (cadeau) : la ligne compte 0 € ; sa quantité entre quand même au stock. */
  offert?: boolean;
}

export interface LigneCarburant {
  type: TypeCarburant;
  montant: number;
  /** Litrage facultatif — utile pour les aides calculées au litre (ex: GNR). */
  litrage?: number;
}

/** Un article d'une facture de la Chambre d'agriculture : son nom et son montant TTC. */
export interface LigneChambre {
  libelle: string;
  montant: number;
  /** Une ligne d'équarrissage : la fiche fournisseur de l'équarrisseur qui la reçoit (absente : l'unique équarrisseur, s'il n'y en a qu'un). */
  equarrisseurId?: string;
}

/**
 * Ce qui a été fait lors d'une visite du vétérinaire (un acte, un traitement) : de quoi remplir une ligne du carnet sanitaire. Elle ne
 * porte pas de montant : celui de la facture reste son total.
 */
export interface LigneVeterinaire {
  id: string;
  /** L'acte ou le traitement (prise de sang, vaccin, antibiotique…). */
  libelle: string;
  /** Le n° d'animal ou le lot concerné ; absent : le troupeau entier. */
  animal?: string;
  /** Le n° d'ordonnance ou la référence de l'annexe. */
  ordonnance?: string;
  /** Les dates de début et de fin du traitement (AAAA-MM-JJ). */
  dateDebut?: string;
  dateFin?: string;
  /** Le médicament : la voie d'administration, la dose et le rythme. */
  voie?: string;
  dose?: string;
  rythme?: string;
  /** La date de remise en vente de la viande et du lait (AAAA-MM-JJ). */
  remiseEnVente?: string;
  /** Le motif du traitement et les observations. */
  observations?: string;
}

export interface Facture {
  id: string;
  date: string;
  type: TypeFacture;
  tiers: string; // fournisseur ou client
  /** Une dépense d'animaux vivants (achat, abattoir) : le document de circulation déposé ; absent tant qu'il manque. */
  documentCirculation?: DocumentCirculationDepose;
  /** Activité de la facture ; absente sur les anciennes factures (voir activiteFacture). */
  activite?: ActiviteComptable;
  description: string;
  montant: number;
  /** Uniquement pour type === 'recue'. */
  categorieDepense?: CategorieDepense;
  /** Une dépense offerte par le fournisseur (un cadeau) : ses lignes offertes comptent 0 € (voir `offert` des lignes) ; une dépense sans détail vaut 0 €. Les quantités entrent quand même au stock. */
  offert?: boolean;
  /** Formulaire de modification seulement (jamais enregistré) : dépense offerte sans détail par ligne, le bouton « Cadeau » du montant (faux : il est facturé). */
  cadeauMontant?: boolean;
  /** Le paiement : faux = pas encore réglé ou encaissé (voir echeance) ; absent : réglé à la date de la facture (le cas d'office). */
  payee?: boolean;
  /** Une dépense qui n'a pas été facturée : pas de facture, donc pas de TVA à déduire. Elle reste dans la trésorerie et la rentabilité. */
  sansFacture?: boolean;
  /** Pour une facture pas encore réglée ou encaissée : la date prévue du paiement. */
  echeance?: string;
  /** La date où la facture a été réglée ou encaissée, quand elle diffère de sa date (la trésorerie s'en sert). */
  datePaiement?: string;
  /**
   * Pour une facture reçue : l'atelier qu'elle concerne (voir ATELIER) ; absent : une charge commune, répartie entre les ateliers.
   * Pour une facture émise : l'atelier de sa recette (l'agritourisme) ; absent : une « autre recette ».
   */
  atelier?: string;
  /** Pour une charge de l'atelier Agritourisme : l'élément qu'elle concerne (le 4x4, le repas…) ; absent : toutes les visites. */
  elementAgri?: string;
  /** Uniquement si categorieDepense === 'alimentation' : une facture peut regrouper plusieurs aliments. */
  lignesAlimentation?: LigneAlimentation[];
  /** Uniquement si categorieDepense === 'achats_marchandises' dans un gîte : le détail des marchandises achetées. */
  lignesMarchandises?: LigneMarchandise[];
  /** Achat de production : le détail par fourniture (chacune entre au stock). Les anciennes factures n'ont que stockArticle, stockQuantite et bouclesDebut (voir lignesProductionDe). */
  lignesProduction?: LigneProduction[];
  /** Une dépense « Animaux vivants » : les identifiants des fiches créées dans le cheptel pour les animaux achetés, séparés par des points-virgules. */
  animauxAchetes?: string;
  /** Une dépense « Animaux vivants (vente) » : les identifiants des fiches du cheptel des animaux envoyés (à l'abattoir), séparés par des points-virgules. */
  animauxEnvoyes?: string;
  /** Une facture de la Chambre d'agriculture détaillée par article (forfait d'identification, équarrissage ATM, conseils et analyses). */
  lignesChambre?: LigneChambre[];
  /** Une dépense vétérinaire : tout ce qui a été fait lors de la visite (voir LigneVeterinaire), repris par le carnet sanitaire. */
  lignesVeterinaire?: LigneVeterinaire[];
  /**
   * Vrai quand les quantités de lignesMarchandises ont été ajoutées au stock du gîte. Une facture d'avant cette gestion du
   * stock ne l'a pas : la première fois qu'on l'enregistre de nouveau, ses quantités sont ajoutées (une seule fois).
   */
  stockApplique?: boolean;
  /** Achat de production : l'article de l'inventaire (voir cleArticle) qui reçoit la quantité achetée. */
  stockArticle?: string;
  /** Achat de production : la quantité achetée, ajoutée au stock de stockArticle. */
  stockQuantite?: number;
  /** Dépense vétérinaire : le motif de la visite. */
  motifVisite?: string;
  /** Dépense vétérinaire : la visite (date et motif) est aussi inscrite dans les visites vétérinaires. */
  visiteVeterinaire?: boolean;
  /** Achat de boucles : le numéro de la première (les suivantes se numérotent à la suite, selon la quantité). */
  bouclesDebut?: string;
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
  /**
   * Pour une recette d'entreprise : sa nature pour la déclaration URSSAF (vente de marchandises, prestations commerciales ou
   * libérales) ; absente, elle se déduit de la catégorie.
   */
  natureUrssaf?: NatureUrssaf;
  /** Pour l'URSSAF : la part (€ TTC) de la recette qui est une vente de marchandises (les repas d'un séjour), le reste suivant la nature. */
  partVenteUrssaf?: number;
  /** Pour l'URSSAF : la part (€ TTC) de la recette qui n'est pas du chiffre d'affaires (la taxe de séjour collectée). */
  partHorsCaUrssaf?: number;
  /**
   * Taux de TVA (%) indiqué sur la facture, tel quel : pour une facture reçue (achat), et pour une facture émise
   * d'une entreprise assujettie à la TVA.
   */
  tauxTva?: number;
}

export type CategorieVente = ValeurDe<typeof CATEGORIE_VENTE>;
export type TypeFromage = ValeurDe<typeof TYPE_FROMAGE>;
export type UniteVente = ValeurDe<typeof UNITE_VENTE>;
export type TypeChoixFacture = ValeurDe<typeof TYPE_CHOIX_FACTURE>;
export type NatureUrssaf = ValeurDe<typeof NATURE_URSSAF>;

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
  /** Pour les ventes d'animaux (cabris, animal sur pied, animal vivant) : poids total vendu, facultatif. */
  poidsKg?: number;
  /** Pour la vente d'un animal sur pied ou vivant : vrai si c'est un petit (cabri, agneau…), faux ou absent pour un adulte. */
  jeune?: boolean;
  /**
   * Vente de viande : l'état des animaux à la remise. Absent : ils partent vivants à l'abattoir (d'office, pour une vente déclarée) ; « vivants » :
   * ils sont vendus vivants au client ; « morts » : ils sont déjà morts (pas de transport d'animaux vivants, donc pas de document de circulation).
   */
  etatAnimaux?: 'vivants' | 'morts';
  /** Le document de circulation déposé (le scan du document rempli) ; absent tant qu'il manque. */
  documentCirculation?: DocumentCirculationDepose;
  /** Pour la vente d'animaux sur pied ou vivants : les fiches du cheptel des animaux vendus (leurs identifiants séparés par « ; »). */
  animaux?: string;
  /** Pour une vente de viande avec des animaux : la date d'abattoir (celle de la sortie du cheptel) ; absente : la date de la vente. */
  dateAbattoir?: string;
  /** Pour la vente de fromages identifiés : les lots vendus (leurs identifiants séparés par « ; »). */
  fromages?: string;
  /** Commentaire facultatif précisant de quoi il s'agissait (viande, charcuterie, animal sur pied ou vivant). */
  precision?: string;
  /** Le client souhaite-t-il que la vente soit déclarée ? Absent (ventes d'avant ce choix) : oui. */
  choixFacture?: TypeChoixFacture;
  /** Le numéro de la facture, obligatoire quand le client souhaite que la vente soit déclarée. */
  numeroFacture?: string;
  /** Un réajustement (vente de lait d'un récolteur) : sans litrage ni numéro de facture saisis. */
  reajustement?: boolean;
  /** Une vente offerte (un cadeau au client) : son prix est de 0 €, les animaux et les produits sortent quand même du stock. */
  offert?: boolean;
  /** Des animaux vivants vendus au poids vif (des animaux de réforme) : le prix se compte au kilo, saisi (sinon, un animal vivant se vend à la tête). */
  venduAuPoids?: boolean;
  /** Formulaire de modification seulement (jamais enregistré) : vente offerte, le bouton « Cadeau » des animaux (faux : ils sont facturés). */
  cadeauProduit?: boolean;
  /** Formulaire de modification seulement (jamais enregistré) : vente offerte, le bouton « Cadeau » des frais d'abattoir (vrai : non facturés ; absent : selon que la vente en a). */
  cadeauFrais?: boolean;
  /** Le paiement : faux = pas encore encaissé (voir echeance) ; absent : encaissé à la date de la vente (le cas d'office). */
  payee?: boolean;
  /** Pour une vente pas encore encaissée : la date prévue du paiement. */
  echeance?: string;
  /** La date où la vente a été encaissée, quand elle diffère de sa date (la trésorerie s'en sert). */
  datePaiement?: string;
  /** Le circuit par lequel la vente est passée (voir CIRCUIT_VENTE) ; absent : non précisé. */
  circuit?: string;
  /** La commande dont la livraison a créé la vente : son prix est celui de la commande, pas celui de l'inventaire. */
  commandeId?: string;
  /** Pour une vente de viande : les frais d'abattoir refacturés au client (€ TTC), compris dans `prix`, et leur taux de TVA (celui de la vente à défaut). */
  fraisAbattoir?: number;
  tauxTvaFrais?: number;
}
