/** Un séjour : une chambre réservée pour une ou plusieurs nuits. */
export interface Sejour {
  id: string;
  /** Numéro de la chambre (1 à 6). */
  chambre: number;
  /** Première nuit (AAAA-MM-JJ). */
  arrivee: string;
  /** Jour du départ (AAAA-MM-JJ) : la dernière nuit est la veille. */
  depart: string;
  /** Nom du locataire ou du groupe. */
  nom: string;
  /** Fiche client du locataire, si elle existe (voir features/clients). */
  clientId?: string;
  /** Nombre de personnes dans la chambre. */
  personnes: number;
  /** Prix payé pour le séjour (€). */
  prix: number;
  notes?: string;
  /** La facture d'hébergement créée en comptabilité pour ce séjour (mise à jour avec lui). */
  factureId?: string;
}

/** Tout ce que contient la gestion du gîte pour un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveGite {
  sejours: Sejour[];
}
