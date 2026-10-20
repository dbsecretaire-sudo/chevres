import type { Ionicons } from '@expo/vector-icons';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
import { SEXE } from '@/shared/constants/cheptel';
import { FAMILLE_CONTROLE, ONGLET_SANTE } from '@/shared/constants/controles';
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
 * Les boutons de l'accueil qui ouvrent des bulles : ceux de l'intérieur de l'exploitation (santé, grange, organismes, nouveau) et les fournisseurs. Les
 * autres intervenants ouvrent directement leur fiche, qui regroupe toutes leurs actions.
 */
export type CibleDesBulles = 'nouveau' | 'sante' | 'grange' | 'fournisseurs' | 'organismes';

const B = TEXTES.accueil.ferme.bulles;
const L = TEXTES.production.lieux;
const NOUVELLE = ROUTES.COMPTABILITE_NOUVELLE;

/** Les actions qui sortent en bulles quand on touche un bouton de l'accueil : les écrans qu'on y ouvre le plus. */
export function actionsDuLieu(cible: CibleDesBulles): ActionDeLieu[] {
  switch (cible) {
    case 'nouveau':
      // Ce qu'on ajoute au troupeau : une naissance, une chèvre, un bouc, et une perte (une morte).
      return [
        { cle: 'naissance', titre: B.naissance, icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE },
        {
          cle: 'chevre',
          titre: B.chevre,
          icone: 'female',
          route: `${ROUTES.CHEPTEL_NOUVELLE}?sexe=${SEXE.FEMELLE}`,
        },
        { cle: 'bouc', titre: B.bouc, icone: 'male', route: `${ROUTES.CHEPTEL_NOUVELLE}?sexe=${SEXE.MALE}` },
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
    case 'organismes':
      return [
        { cle: 'dossierPac', titre: B.dossierPac, icone: 'document-text', route: ROUTES.CHEPTEL_DOSSIER_PAC },
        {
          cle: 'aides',
          titre: B.aides,
          icone: 'cash',
          route: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.AIDE}`,
        },
      ];
    case 'fournisseurs':
      return [
        { cle: 'aliments', titre: L.aliments.titre, icone: 'nutrition', route: ROUTES.lieu('aliments') },
        { cle: 'carburant', titre: L.carburant.titre, icone: 'car', route: ROUTES.lieu('carburant') },
        { cle: 'contacts', titre: B.contacts, icone: 'people', route: ROUTES.CONTACTS },
        { cle: 'nouveau', titre: B.nouveauContact, icone: 'add-circle', route: ROUTES.CONTACT_NOUVEAU },
      ];
  }
}
