import type { CategorieAnimal } from '@/features/cheptel/utils/chevreLabel';
import { CATEGORIE_ANIMAL } from '@/shared/constants/cheptel';

/** Le fond du dessin d'un animal dans la liste de la chèvrerie : vert pour un petit (cabri), rose pour une femelle adulte, bleu pour un mâle adulte. */
export const FOND_PETIT = '#DDEBCB';
export const FOND_FEMELLE = '#F8DCE6';
export const FOND_MALE = '#D6E6F6';

/** La couleur de fond d'après la catégorie de l'accueil (petit, bouc, chèvre) ; `undefined` pour toute autre. */
export function fondDeLAnimal(categorie: CategorieAnimal): string | undefined {
  switch (categorie) {
    case CATEGORIE_ANIMAL.CABRIT:
      return FOND_PETIT;
    case CATEGORIE_ANIMAL.CHEVRE:
      return FOND_FEMELLE;
    case CATEGORIE_ANIMAL.BOUC:
      return FOND_MALE;
    default:
      return undefined;
  }
}
