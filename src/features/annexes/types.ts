/** Une activité annexe du gîte (pizzas, charcuterie, guide touristique…) : son nom, son icône et le compte où ses ventes s'inscrivent. */
export interface ActiviteAnnexe {
  id: string;
  nom: string;
  /** Le nom d'une icône Ionicons (voir ICONES_ANNEXE). */
  icone: string;
  /** Le numéro du compte du plan comptable (classe 7) des ventes de l'activité. */
  compte: string;
  /** Le taux de TVA des ventes (%) ; absent : celui de l'entreprise, ou aucun. */
  tauxTva?: number;
  /**
   * Vrai : l'activité montre le calendrier des repas du gîte. Un jour ouvre ses tickets, qui comptent déjà les repas réservés et
   * payés de ce jour-là (le restaurant).
   */
  repasGite?: boolean;
}

/** Une catégorie d'articles d'une activité (« Pizzas », « Boissons », « Visites »…). */
export interface CategorieAnnexe {
  id: string;
  activiteId: string;
  nom: string;
}

/** Un article vendu par une activité : son prix de vente TTC, et son stock quand on le suit (un service n'en a pas). */
export interface ArticleAnnexe {
  id: string;
  activiteId: string;
  categorieId?: string;
  nom: string;
  prix: number;
  /** Vrai : le stock baisse à chaque vente (une visite guidée, par exemple, n'a pas de stock). */
  suiviStock: boolean;
  stock: number;
}

export interface LigneTicketAnnexe {
  articleId: string;
  quantite: number;
}

/** Une commande en cours d'une activité ; elle disparaît quand sa vente est enregistrée. */
export interface TicketAnnexe {
  id: string;
  activiteId: string;
  nom: string;
  /** AAAA-MM-JJ : la date de la vente (celle de la recette en comptabilité) ; absente : le jour où on l'enregistre. */
  date?: string;
  /** Le taux de TVA (%) de ce ticket ; absent : celui de l'activité. */
  tauxTva?: number;
  /** La réservation du gîte dont ce ticket est celui du jour (il porte alors le nom de son propriétaire). */
  sejourId?: string;
  /** Vrai : la vente du ticket est enregistrée (un ticket de réservation reste alors, pour ne pas être recréé le jour même). */
  vendu?: boolean;
  lignes: LigneTicketAnnexe[];
}

/** Tout ce que contiennent les activités annexes d'un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveAnnexes {
  /** Vrai quand les activités d'office (bar, restaurant) ont été créées une première fois : on ne les recrée pas si on les supprime. */
  initialisee?: boolean;
  activites: ActiviteAnnexe[];
  categories: CategorieAnnexe[];
  articles: ArticleAnnexe[];
  tickets: TicketAnnexe[];
}
