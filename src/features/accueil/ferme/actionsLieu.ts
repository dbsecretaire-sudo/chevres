import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
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
  /** Un nombre en pastille rouge sur la bulle (les rappels de lots à faire) : rien quand il n'y a rien à signaler. */
  pastille?: number;
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
        {
          cle: 'fabriquerSavon',
          titre: B.fabriquerSavon,
          icone: 'restaurant',
          iconeMci: 'hand-wash',
          route: ROUTES.productionFabrication(PRODUIT_A_LOTS.SAVON),
        },
      ];
    case 'lots':
      // Un seul bouton : on choisit les lots (la page des produits suivis lot par lot) ou leurs rappels.
      return [
        { cle: 'lotsDeLAtelier', titre: B.lotsAtelier, icone: 'layers', route: ROUTES.PRODUCTION_LOTS },
        { cle: 'rappelsLots', titre: B.rappelsLots, icone: 'notifications', route: ROUTES.PRODUCTION_RAPPELS_LOTS },
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

/** Les pages du cheptel, dans la page de menu qui s'ouvre avant d'y entrer : la liste des animaux, les naissances, les sorties, les lots, les traitements, les boucles et les contrôles. */
export function pagesDuCheptel(): ActionDeLieu[] {
  return [
    { cle: 'cheptelListe', titre: B.cheptelListe, icone: 'paw', route: ROUTES.lieu('animaux') },
    { cle: 'cheptelNaissances', titre: B.naissances, icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCES },
    { cle: 'cheptelSorties', titre: B.sorties, icone: 'log-out', route: ROUTES.CHEPTEL_HISTORIQUE },
    { cle: 'cheptelLots', titre: B.lotsAnimaux, icone: 'layers', route: ROUTES.CHEPTEL_LOTS },
    { cle: 'cheptelTraitements', titre: B.traitements, icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENTS },
    { cle: 'cheptelBoucles', titre: B.boucles, icone: 'pricetag', route: ROUTES.lieu('boucles') },
    { cle: 'cheptelControles', titre: B.controlesAnimaux, icone: 'clipboard', route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.ANIMAUX) },
  ];
}
