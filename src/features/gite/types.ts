/** Un séjour : une chambre réservée pour une ou plusieurs nuits. */
export interface Sejour {
  id: string;
  /** Numéros des chambres réservées (1 à 6) : leur nombre sert à la tarification. */
  chambres: number[];
  /** Première nuit (AAAA-MM-JJ). */
  arrivee: string;
  /** Jour du départ (AAAA-MM-JJ) : la dernière nuit est la veille. */
  depart: string;
  /** Nom du locataire ou du groupe. */
  nom: string;
  /** Fiche client du locataire, si elle existe (voir features/clients). */
  clientId?: string;
  /** Nombre de personnes, pour préparer les lits (facultatif ; quatre lits par chambre). */
  personnes?: number;
  /** Prix payé en tout pour le séjour (€) : hébergement + taxe de séjour + repas. */
  prix: number;
  /** Prix d'une chambre par nuit (€) ; absent des séjours d'avant le détail du prix. */
  prixNuit?: number;
  /** Nombre de repas pris pendant le séjour. */
  repas?: number;
  /** Prix d'un repas (€). */
  prixRepas?: number;
  /** Taxe de séjour due pour le séjour (€) : collectée pour la commune, hors chiffre d'affaires. */
  taxe?: number;
  notes?: string;
  /** Vrai une fois le paiement reçu et validé : c'est alors seulement qu'il est inscrit en comptabilité. */
  paye?: boolean;
  /** Date du paiement (AAAA-MM-JJ), date des recettes en comptabilité. */
  datePaiement?: string;
  /** La facture d'hébergement créée en comptabilité pour ce séjour (mise à jour avec lui). */
  factureId?: string;
  /** La facture de restauration (les repas), créée quand il y en a. */
  factureRepasId?: string;
}

/** Tout ce que contient la gestion du gîte pour un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveGite {
  sejours: Sejour[];
}
