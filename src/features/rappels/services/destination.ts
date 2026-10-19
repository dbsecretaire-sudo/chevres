import { GENRE_RAPPEL } from '@/shared/constants/rappels';
import { ROUTES } from '@/shared/constants/routes';
import type { GenreRappel } from '@/features/rappels/services/rappels';

/** L'écran où l'on fait la déclaration d'un rappel. */
export const destinationRappel = (
  genre: GenreRappel | typeof GENRE_RAPPEL.GROUPEMENT | typeof GENRE_RAPPEL.CIRCULATION,
): string =>
  genre === GENRE_RAPPEL.RSA ? ROUTES.FISCALITE_RSA : ROUTES.URSSAF;
