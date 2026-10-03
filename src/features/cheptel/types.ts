import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';

export type Sexe = ValeurDe<typeof SEXE>;

export type StatutChevre = ValeurDe<typeof STATUT_CHEVRE>;

export interface Chevre {
  id: string;
  /** Facultatif : légalement obligatoire seulement à partir de 6 mois (l'animal n'est alors plus un cabrit). */
  numeroBoucle?: string;
  /** Date de pose de la boucle — souvent postérieure à la naissance. */
  dateBouclage?: string; // YYYY-MM-DD
  nom?: string;
  sexe: Sexe;
  dateNaissance: string; // YYYY-MM-DD
  mereId?: string;
  mereNumeroBoucle?: string;
  statut: StatutChevre;
  dateStatut?: string; // YYYY-MM-DD, présent quand statut !== 'vivante'
  /** Désigné(e) pour rester dans le troupeau reproducteur (indépendant du statut vivant/mort). */
  renouvellement?: boolean;
  /** Année pour laquelle la désignation au renouvellement a été faite. */
  renouvellementAnnee?: number;
  notes?: string;
}
