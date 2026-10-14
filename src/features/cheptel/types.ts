import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';

export type Sexe = ValeurDe<typeof SEXE>;

export type StatutChevre = ValeurDe<typeof STATUT_CHEVRE>;

export interface Chevre {
  id: string;
  /** Espèce de l'animal ; absente sur les fiches saisies avant le choix de l'espèce (voir especeDe). */
  espece?: EspeceAnimale;
  /** Facultatif : obligatoire seulement une fois l’âge limite du petit dépassé (l'animal n'est alors plus un petit). */
  numeroBoucle?: string;
  /** Date de pose de la boucle — souvent postérieure à la naissance. */
  dateBouclage?: string; // YYYY-MM-DD
  /** La boucle rouge posée en plus (remplacement provisoire d'une boucle cassée) : la date de sa pose, sans numéro (`numeroBoucleRouge` ne vient que des anciennes fiches). */
  numeroBoucleRouge?: string;
  dateBoucleRouge?: string; // YYYY-MM-DD
  /** Le rebouclage (boucle de rebouclage, qui remplace une boucle perdue ou cassée) : la date seulement, sans numéro. */
  dateRebouclage?: string; // YYYY-MM-DD
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
