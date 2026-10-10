import type { ATraiter } from '@/features/a-traiter/types';
import { GENRE_A_TRAITER } from '@/shared/constants/aTraiter';
import { ROUTES } from '@/shared/constants/routes';
import { destinationRappel } from '@/features/rappels/services/destination';
import type { GenreRappel } from '@/features/rappels/services/rappels';

/** L'écran à ouvrir pour une chose à traiter (une fois son établissement ouvert). */
export function destinationDe({ genre, cibleId }: Pick<ATraiter, 'genre' | 'cibleId'>): string {
  switch (genre) {
    case GENRE_A_TRAITER.SEJOUR_A_ENCAISSER:
      return ROUTES.sejour(cibleId);
    case GENRE_A_TRAITER.RAPPEL_FISCAL:
      return destinationRappel(cibleId as GenreRappel);
    case GENRE_A_TRAITER.LOTS_A_RAPPELER:
    case GENRE_A_TRAITER.RAPPEL_LOT_A_VALIDER:
      return ROUTES.PRODUCTION_RAPPELS_LOTS;
    case GENRE_A_TRAITER.NOTE_A_FACTURER:
      return ROUTES.dossierClient(cibleId);
    default:
      return ROUTES.element(cibleId);
  }
}
