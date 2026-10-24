import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { GENRE_A_TRAITER } from '@/shared/constants/aTraiter';

export type GenreATraiter = ValeurDe<typeof GENRE_A_TRAITER>;

/**
 * Une chose qui attend l'utilisateur dans un établissement : une déclaration à valider, des lots à rappeler.
 * `cibleId` est l'identifiant de ce qu'on ouvre : l'adresse de l'écran se calcule une fois l'établissement ouvert.
 */
export interface ATraiter {
  id: string;
  etablissementId: string;
  etablissementNom: string;
  /** Vrai pour ce qui est en retard (une déclaration non faite à temps) : seul le retard est en rouge. */
  enRetard?: boolean;
  /** Le logo de l'établissement (la patte…) : à côté de chaque ligne, on voit tout de suite de quel établissement elle vient. */
  icone?: string;
  genre: GenreATraiter;
  libelle: string;
  cibleId: string;
}
