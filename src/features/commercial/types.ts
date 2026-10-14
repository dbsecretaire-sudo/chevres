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
  /** La livraison est à encaisser plus tard (la trésorerie compte le paiement à son échéance). */
  enAttente?: boolean;
  echeance?: string;
}

/** Tout le volet commercial d'un établissement. */
export interface ArchiveCommercial {
  commandes: Commande[];
  /** Les prix par catégorie de client : article → catégorie du client → prix à la pièce (€). Absent : le prix de l'inventaire. */
  tarifs: Record<string, Record<string, number>>;
}
