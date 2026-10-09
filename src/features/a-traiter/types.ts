import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { GENRE_A_TRAITER } from '@/shared/constants/aTraiter';

export type GenreATraiter = ValeurDe<typeof GENRE_A_TRAITER>;

/**
 * Une chose qui attend l'utilisateur dans un établissement : une tâche, un séjour à encaisser, la note d'un client à facturer.
 * `cibleId` est l'identifiant de ce qu'on ouvre (le contenu, le séjour ou le client) : l'adresse de l'écran se calcule une fois
 * l'établissement ouvert, car certaines dépendent de son mode.
 */
export interface ATraiter {
  id: string;
  etablissementId: string;
  etablissementNom: string;
  genre: GenreATraiter;
  libelle: string;
  cibleId: string;
}
