import type { CATEGORIE_ARTICLE_GITE } from '@/shared/constants/bar';
import type { RUBRIQUE_MARCHANDISE } from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Une boisson proposée au bar, avec son prix de vente (€) et son stock (nombre d'unités, comptées à la vente). */
export interface Boisson {
  id: string;
  nom: string;
  prix: number;
  stock?: number;
  /** L'activité du gîte pour laquelle la boisson est tenue (bar, restaurant, activité annexe) ; absente : toutes. */
  rubrique?: ValeurDe<typeof RUBRIQUE_MARCHANDISE>;
}

/** Un aliment tenu en stock pour la restauration (farine, huile, légumes…), avec le nom choisi. */
export interface Aliment {
  id: string;
  nom: string;
  stock: number;
  /** L'activité du gîte pour laquelle l'aliment est tenu ; absente : toutes. */
  rubrique?: ValeurDe<typeof RUBRIQUE_MARCHANDISE>;
}

/** Un article du stock d'un gîte qui n'est ni une boisson ni un aliment : du matériel, un conditionnement ou de l'entretien. */
export interface ArticleGite {
  id: string;
  nom: string;
  stock: number;
  categorie: ValeurDe<typeof CATEGORIE_ARTICLE_GITE>;
  /** L'activité du gîte pour laquelle l'article est tenu ; absente : toutes. */
  rubrique?: ValeurDe<typeof RUBRIQUE_MARCHANDISE>;
}

/** Une boisson et le nombre commandé sur un ticket. */
export interface LigneTicket {
  boissonId: string;
  quantite: number;
}

/**
 * Un ticket du bar : une commande en cours (une table, un client), avec un nom (« Ticket 1 » d'office, modifiable) et les
 * boissons commandées. Il disparaît de la liste quand sa vente est enregistrée.
 */
export interface TicketBar {
  id: string;
  nom: string;
  lignes: LigneTicket[];
}

/** Tout ce que contient le bar et la restauration d'un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveBar {
  boissons: Boisson[];
  aliments: Aliment[];
  /** Le matériel, le conditionnement et l'entretien. */
  articles: ArticleGite[];
  /** Les tickets en cours au bar (vente pas encore enregistrée). */
  tickets: TicketBar[];
  /**
   * L'ordre choisi des articles de chaque étiquette du stock (« consommables » : boissons et aliments mêlés, « materiel »,
   * « conditionnement », « entretien ») : leurs identifiants ; ceux qui n'y sont pas suivent, dans l'ordre de création.
   */
  ordres: Record<string, string[]>;
}
