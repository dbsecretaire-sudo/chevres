import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import type { PieceJointe } from '@/features/fichiers/types';

export interface VisiteVeterinaire {
  id: string;
  /** Espèce concernée ; absente sur les anciennes visites (voir especeDe). */
  espece?: EspeceAnimale;
  date: string;
  chevreId?: string;
  chevreNumeroBoucle?: string; // vide = troupeau entier
  motif: string;
  description?: string;
  cout?: number;
  /** Fichiers joints à la fiche de la visite (ordonnance, compte rendu…). */
  fichiers?: PieceJointe[];
  /** La facture vétérinaire qui a créé cette visite : la visite suit ses modifications et disparaît avec elle. */
  factureId?: string;
  /** Un rapport d'essais accompagne la visite (analyses du vétérinaire ou du laboratoire) ; `numeroRapport` en donne le numéro. */
  rapportEssais?: boolean;
  numeroRapport?: string;
}

/**
 * Un traitement donné à des animaux (antibiotique, vermifuge, vaccin…) avec ses délais d'attente : le temps après la dernière prise
 * pendant lequel le lait, ou la viande, ne peut être ni vendu ni consommé.
 */
export interface Traitement {
  id: string;
  /** Espèce concernée ; absente sur les anciens traitements (voir especeDe). */
  espece?: EspeceAnimale;
  /** Le début du traitement (AAAA-MM-JJ). */
  date: string;
  /** La dernière prise (AAAA-MM-JJ) ; à défaut, le jour du début : c'est elle qui lance le délai d'attente. */
  dateFin?: string;
  /** Le médicament ou le produit donné. */
  produit: string;
  /** Pourquoi (mammite, parasites, vaccin…). */
  motif?: string;
  /** Les n° de boucle des animaux traités, séparés par des virgules (vide : le troupeau entier). */
  chevreNumeroBoucle?: string;
  /** Le lot d'animaux auquel le traitement a été donné (voir les lots des réglages) : le suivi sanitaire du lot le retrouve. */
  lotId?: string;
  /** La visite du vétérinaire (celle d'une de ses factures) à laquelle le traitement se rattache : la page des visites le montre sous elle. */
  visiteId?: string;
  /** Le délai d'attente pour le lait, en jours après la dernière prise (absent ou 0 : aucun). */
  delaiLaitJours?: number;
  /** Le délai d'attente pour la viande, en jours après la dernière prise (absent ou 0 : aucun). */
  delaiViandeJours?: number;
  notes?: string;
  /** Les fichiers joints (la photo de l'ordonnance, la notice). */
  fichiers?: PieceJointe[];
}
