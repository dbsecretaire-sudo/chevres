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

/** Tout ce que contient le bar et la restauration d'un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveBar {
  boissons: Boisson[];
  aliments: Aliment[];
}
