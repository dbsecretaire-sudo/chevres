/** Une boisson proposée au bar, avec son prix de vente (€) et son stock (nombre d'unités, comptées à la vente). */
export interface Boisson {
  id: string;
  nom: string;
  prix: number;
  stock?: number;
}

/** Un aliment tenu en stock pour la restauration (farine, huile, légumes…), avec le nom choisi. */
export interface Aliment {
  id: string;
  nom: string;
  stock: number;
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
  /** Les tickets en cours au bar (vente pas encore enregistrée). */
  tickets: TicketBar[];
}
