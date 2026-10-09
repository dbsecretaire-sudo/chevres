import type { ATraiter } from '@/features/a-traiter/types';
import { GENRE_A_TRAITER } from '@/shared/constants/aTraiter';
import { ROUTES } from '@/shared/constants/routes';

/** L'écran à ouvrir pour une chose à traiter (une fois son établissement ouvert). */
export function destinationDe({ genre, cibleId }: Pick<ATraiter, 'genre' | 'cibleId'>): string {
  switch (genre) {
    case GENRE_A_TRAITER.SEJOUR_A_ENCAISSER:
      return ROUTES.sejour(cibleId);
    case GENRE_A_TRAITER.NOTE_A_FACTURER:
      return ROUTES.dossierClient(cibleId);
    default:
      return ROUTES.element(cibleId);
  }
}
