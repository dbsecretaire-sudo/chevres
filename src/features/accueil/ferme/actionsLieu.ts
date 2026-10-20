import type { Ionicons } from '@expo/vector-icons';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/** Une bulle d'action autour d'un bouton de l'accueil : son icône, son nom, et l'écran qu'elle ouvre. */
export interface ActionDeLieu {
  cle: string;
  titre: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
}

/**
 * Les boutons de l'accueil qui ouvrent des bulles : ceux de l'intérieur de l'exploitation (santé, grange). Les autres boutons (les intervenants, le
 * cheptel, les documents) ouvrent directement leur page, qui regroupe toutes leurs actions.
 */
export type CibleDesBulles = 'sante' | 'grange';

const B = TEXTES.accueil.ferme.bulles;
const NOUVELLE = ROUTES.COMPTABILITE_NOUVELLE;

/** Les actions qui sortent en bulles quand on touche un bouton de l'accueil : les écrans qu'on y ouvre le plus. */
export function actionsDuLieu(cible: CibleDesBulles): ActionDeLieu[] {
  switch (cible) {
    case 'sante':
      return [
        { cle: 'traitements', titre: B.traitements, icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENTS },
        {
          cle: 'carnetSanitaire',
          titre: B.carnetSanitaire,
          icone: 'clipboard',
          // Les visites du vétérinaire sont dans sa fiche (depuis qu'elles ne sont plus un onglet des contrôles).
          route: ROUTES.lieu('veterinaire'),
        },
      ];
    case 'grange':
      return [
        { cle: 'alimentation', titre: B.alimentation, icone: 'nutrition', route: ROUTES.SANTE_ALIMENTATION },
        {
          cle: 'acheter',
          titre: B.acheterNourriture,
          icone: 'cart',
          route: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.ALIMENTATION}`,
        },
        { cle: 'stock', titre: B.stockNourriture, icone: 'cube', route: ROUTES.lieu('grange') },
      ];
  }
}
