import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ROUTES } from '@/shared/constants/routes';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

/** Une bulle d'action autour d'un bouton de l'accueil : son icône, son nom, et l'écran qu'elle ouvre. */
export interface ActionDeLieu {
  cle: string;
  titre: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** Quand il est donné, le dessin vient de cette famille (l'épi de maïs n'existe pas dans l'autre) et remplace `icone`. */
  iconeMci?: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
}

/**
 * Les boutons de l'accueil qui ouvrent des bulles : ceux de l'intérieur de l'exploitation (grange) et les lots de l'atelier. Les autres boutons (les intervenants, le
 * cheptel, les documents) ouvrent directement leur page, qui regroupe toutes leurs actions.
 */
export type CibleDesBulles = 'grange' | 'lots' | 'fabriquer';

const B = TEXTES.accueil.ferme.bulles;

/** Les actions qui sortent en bulles quand on touche un bouton de l'accueil : les écrans qu'on y ouvre le plus. */
export function actionsDuLieu(cible: CibleDesBulles): ActionDeLieu[] {
  switch (cible) {
    case 'fabriquer':
      return [
        {
          cle: 'fabriquerFromage',
          titre: B.fabriquerFromage,
          icone: 'restaurant',
          iconeMci: 'cheese',
          route: ROUTES.productionFabrication(PRODUIT_A_LOTS.FROMAGE),
        },
        {
          cle: 'fabriquerCharcuterie',
          titre: B.fabriquerCharcuterie,
          icone: 'restaurant',
          iconeMci: 'knife',
          route: ROUTES.productionFabrication(PRODUIT_A_LOTS.CHARCUTERIE),
        },
        {
          cle: 'fabriquerPlat',
          titre: B.fabriquerPlat,
          icone: 'restaurant',
          iconeMci: 'pot-steam',
          route: ROUTES.productionFabrication(PRODUIT_A_LOTS.PLAT),
        },
      ];
    case 'lots':
      return [
        { cle: 'lotsFromages', titre: B.lotsFromages, icone: 'layers', route: ROUTES.PRODUCTION_FROMAGES },
        {
          cle: 'lotsCharcuterie',
          titre: B.lotsCharcuterie,
          icone: 'restaurant',
          iconeMci: 'sausage',
          route: ROUTES.PRODUCTION_CHARCUTERIE,
        },
        {
          cle: 'lotsViande',
          titre: B.lotsViande,
          icone: 'restaurant',
          iconeMci: 'food-steak',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          cle: 'rappelsLots',
          titre: B.rappelsLots,
          icone: 'notifications',
          route: ROUTES.PRODUCTION_RAPPELS_LOTS,
        },
      ];
    case 'grange':
      return [
        {
          cle: 'alimentation',
          titre: B.alimentation,
          icone: 'nutrition',
          iconeMci: 'corn',
          route: ROUTES.SANTE_ALIMENTATION,
        },
        { cle: 'stock', titre: B.stockNourriture, icone: 'cube', route: ROUTES.lieu('grange') },
      ];
  }
}
