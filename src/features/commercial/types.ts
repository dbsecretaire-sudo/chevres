import type { StatutVisite } from '@/shared/constants/agritourisme';
import type { StatutCommande } from '@/shared/constants/commercial';

/** Une ligne d'une commande : un fromage de l'inventaire, sa quantité (pièces) et son prix à la pièce. */
export interface LigneCommande {
  id: string;
  /** L'article de l'inventaire (« fromage:frais »…). */
  article: string;
  /** Le nom du fromage au moment de la commande (il reste lisible si l'article est renommé ou retiré). */
  libelle: string;
  quantite: number;
  /** Le prix à la pièce (€) : le tarif de la catégorie du client, modifiable. */
  prixUnitaire: number;
  /** Les lots réservés pour cette commande (fromages, charcuterie) : ils sont vendus avec la ligne. */
  lotIds?: string[];
}

/** Une commande d'un client : ce qu'il veut, pour quand, et où elle en est (préparée, livrée). */
export interface Commande {
  id: string;
  /** Le numéro lisible de la commande (« C-2026-004 »). */
  numero: string;
  /** La fiche du client, quand la commande en a une ; son nom affiché est toujours dans `client`. */
  clientId?: string;
  client: string;
  /** La date de la commande. */
  date: string;
  /** La date de livraison prévue. */
  livraisonPrevue?: string;
  circuit?: string;
  statut: StatutCommande;
  lignes: LigneCommande[];
  note?: string;
  /** Une fois livrée : la date de livraison et les ventes que la livraison a créées. */
  dateLivraison?: string;
  venteIds?: string[];
  /** Les lignes déjà facturées (une commande se facture en une fois ou par parties) : leurs identifiants. */
  lignesFacturees?: string[];
  /** La livraison est à encaisser plus tard (la trésorerie compte le paiement à son échéance). */
  enAttente?: boolean;
  echeance?: string;
}

/** Une formule d'agritourisme : ce qu'elle comprend (visite, 4x4, repas, dégustation), son prix par personne et ce qu'elle coûte. */
export interface FormuleAgritourisme {
  id: string;
  nom: string;
  /** Le prix par personne (€ TTC). */
  prix: number;
  /** Ce que la formule comprend : les identifiants des éléments choisis (voir elementsDeFormule). */
  elements: string[];
  /** Le taux de TVA de la recette (%) ; absent : le taux d'office de l'agritourisme. */
  tauxTva?: number;
  note?: string;
}

/** Un élément qu'une formule peut comprendre (visite, 4x4, repas, dégustation… ou un élément ajouté) : son nom, et un nom court pour les listes. */
export interface ElementFormule {
  id: string;
  nom: string;
  court?: string;
}

/** Une visite de la ferme : qui vient, quand, combien de personnes, quelle formule, et si elle est payée. */
export interface VisiteAgritourisme {
  id: string;
  date: string;
  /** La fiche du client, quand le groupe en a une ; son nom est toujours dans `client`. */
  clientId?: string;
  client: string;
  formuleId: string;
  /** Le nom de la formule au moment de la visite (il reste lisible si la formule est renommée). */
  formule: string;
  participants: number;
  /** Le prix par personne de cette visite (celui de la formule, modifiable). */
  prixParPersonne: number;
  statut: StatutVisite;
  note?: string;
  /** Le paiement est à encaisser plus tard (la trésorerie compte la recette à son échéance). */
  enAttente?: boolean;
  echeance?: string;
  /** Une fois réalisée : la recette inscrite en comptabilité. */
  factureId?: string;
}

/** Tout le volet commercial d'un établissement. */
export interface ArchiveCommercial {
  commandes: Commande[];
  /** L'agritourisme : les formules proposées et les visites. */
  formules: FormuleAgritourisme[];
  visites: VisiteAgritourisme[];
  /** Les éléments qu'une formule peut comprendre, tels que l'utilisateur les a modifiés ; absent : ceux d'office (voir elementsDeFormule). */
  elementsFormule?: ElementFormule[];
  /** Les prix par catégorie de client : article → catégorie du client → prix à la pièce (€). Absent : le prix de l'inventaire. */
  tarifs: Record<string, Record<string, number>>;
}
