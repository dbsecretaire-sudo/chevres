import type { Ionicons } from '@expo/vector-icons';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { SEXE } from '@/shared/constants/cheptel';
import { FAMILLE_CONTROLE, ONGLET_SANTE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';

/** Une bulle d'action autour d'un bouton de l'accueil : son icône, son nom, et l'écran qu'elle ouvre. */
export interface ActionDeLieu {
  cle: string;
  titre: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
}

/**
 * Les boutons de l'accueil qui ouvrent des bulles : ceux de l'intérieur de l'exploitation (santé, grange, nouveau). Les intervenants ouvrent
 * directement leur fiche, qui regroupe toutes leurs actions.
 */
export type CibleDesBulles = 'nouveau' | 'sante' | 'grange';

const B = TEXTES.accueil.ferme.bulles;
const NOUVELLE = ROUTES.COMPTABILITE_NOUVELLE;

/** Les actions qui sortent en bulles quand on touche un bouton de l'accueil : les écrans qu'on y ouvre le plus. */
export function actionsDuLieu(cible: CibleDesBulles): ActionDeLieu[] {
  switch (cible) {
    case 'nouveau':
      // Ce qu'on ajoute au troupeau : une naissance, une femelle, un mâle (les mots de l'espèce active), et une perte (une morte).
      return [
        { cle: 'naissance', titre: B.naissance, icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE },
        {
          cle: 'chevre',
          titre: capitaliser(vocabulaire().femelle.singulier),
          icone: 'female',
          route: `${ROUTES.CHEPTEL_NOUVELLE}?sexe=${SEXE.FEMELLE}`,
        },
        {
          cle: 'bouc',
          titre: capitaliser(vocabulaire().male.singulier),
          icone: 'male',
          route: `${ROUTES.CHEPTEL_NOUVELLE}?sexe=${SEXE.MALE}`,
        },
        { cle: 'perte', titre: B.perte, icone: 'skull', route: ROUTES.CHEPTEL_LISTE },
      ];
    case 'sante':
      return [
        { cle: 'traitements', titre: B.traitements, icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENTS },
        {
          cle: 'carnetSanitaire',
          titre: B.carnetSanitaire,
          icone: 'clipboard',
          route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, ONGLET_SANTE),
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
