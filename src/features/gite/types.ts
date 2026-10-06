import type { COTE_CHAMBRE, SERVICE_REPAS, TYPE_AJUSTEMENT_SEJOUR } from '@/shared/constants/gite';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/**
 * Un remboursement du client ou une prestation supplémentaire sur un séjour déjà payé : inscrit en comptabilité à sa date
 * (le paiement d'origine n'est jamais annulé, toute trace bancaire y reste).
 */
export interface AjustementSejour {
  id: string;
  type: ValeurDe<typeof TYPE_AJUSTEMENT_SEJOUR>;
  montant: number;
  /** Date du mouvement (AAAA-MM-JJ), date de l'écriture en comptabilité. */
  date: string;
  /** Pour un remboursement : le client garde sa réservation (un geste commercial) ou non. */
  maintenue?: boolean;
  /** L'écriture créée en comptabilité (une dépense pour un remboursement, une recette pour une prestation). */
  factureId?: string;
}

/**
 * Un acompte versé avant le paiement du solde : inscrit en comptabilité à sa date, comme une recette à part (le solde
 * est ensuite le total du séjour moins l'acompte).
 */
export interface AcompteSejour {
  montant: number;
  /** Date du versement (AAAA-MM-JJ), date de l'écriture en comptabilité. */
  date: string;
  /** L'écriture créée en comptabilité. */
  factureId?: string;
}

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
  /** Quand les repas sont pris (le soir quand il n'est pas noté). */
  service?: ValeurDe<typeof SERVICE_REPAS>;
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
  /** L'acompte versé avant le paiement du solde (un seul par séjour). */
  acompte?: AcompteSejour;
  /**
   * Vrai quand le client a été remboursé sans garder sa réservation : elle est inactive (la chambre est libérée, plus
   * aucun repas n'est prévu) mais reste dans l'historique du client.
   */
  abandonne?: boolean;
  /** Remboursements et prestations supplémentaires ajoutés depuis le paiement. */
  ajustements?: AjustementSejour[];
}

/** Une chambre du gîte : son numéro et le côté du couloir où elle se trouve. */
export interface Chambre {
  numero: number;
  cote: ValeurDe<typeof COTE_CHAMBRE>;
}

/** Tout ce que contient la gestion du gîte pour un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveGite {
  sejours: Sejour[];
  /** Les chambres du gîte et leur côté du couloir (six, trois de chaque côté, tant qu'on n'en a pas ajouté). */
  chambres: Chambre[];
}
