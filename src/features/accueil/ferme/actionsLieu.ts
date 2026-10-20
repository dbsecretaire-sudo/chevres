import type { Ionicons } from '@expo/vector-icons';
import { LIEUX_TIERS, type CleLieuTiers } from '@/features/accueil/services/lieuxTiers';
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

/** Les boutons de l'accueil qui ouvrent des bulles : l'enclos, et les lieux des deux colonnes. */
export type CibleDesBulles =
  | 'enclos'
  | 'nouveau'
  | 'sante'
  | 'alimentation'
  | 'aliments'
  | 'laiterie'
  | 'abattoir'
  | 'fournisseurs'
  | 'veterinaire'
  | 'equarrissage'
  | 'organismes'
  | 'contacts';

const B = TEXTES.accueil.ferme.bulles;
const L = TEXTES.production.lieux;
const NOUVELLE = ROUTES.COMPTABILITE_NOUVELLE;

/** Le lieu à tiers (sa page, ses rubriques) qui correspond à un bouton, quand il y en a un. */
const LIEU_A_TIERS: Partial<Record<CibleDesBulles, CleLieuTiers>> = {
  veterinaire: 'veterinaire',
  equarrissage: 'equarrissage',
  abattoir: 'abattoir',
  aliments: 'aliments',
};

/** Combien de rubriques d'un lieu à tiers passent en bulles (en plus de sa page et de « Nouvelle facture »). */
const RUBRIQUES_EN_BULLES = 3;

/** Les bulles d'un lieu à tiers : ses premières rubriques, sa page (contacts et écritures) et « Nouvelle facture ». */
function bullesDuLieuATiers(cle: CleLieuTiers): ActionDeLieu[] {
  const config = LIEUX_TIERS[cle];
  const textes = L[cle];
  const liens = textes.liens as Record<string, { titre: string }>;
  const rubriques = config.liens.slice(0, RUBRIQUES_EN_BULLES).map((l) => ({
    cle: l.cle,
    titre: liens[l.cle]?.titre ?? l.cle,
    icone: l.icone,
    route: l.route,
  }));
  const nouvelle = (textes as { nouvelle?: string }).nouvelle ?? '';
  return [
    ...rubriques,
    { cle: 'page', titre: B.contactsEtEcritures, icone: 'people', route: ROUTES.lieu(cle) },
    { cle: 'nouvelle', titre: nouvelle, icone: 'add-circle', route: config.nouvelle },
  ];
}

/** Les actions qui sortent en bulles quand on touche un bouton de l'accueil : les écrans qu'on y ouvre le plus. */
export function actionsDuLieu(cible: CibleDesBulles): ActionDeLieu[] {
  switch (cible) {
    case 'enclos':
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
    case 'alimentation':
      return [
        { cle: 'alimentation', titre: B.alimentation, icone: 'nutrition', route: ROUTES.SANTE_ALIMENTATION },
        {
          cle: 'acheter',
          titre: B.acheterNourriture,
          icone: 'cart',
          route: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.ALIMENTATION}`,
        },
        { cle: 'grange', titre: B.grange, icone: 'cube', route: ROUTES.lieu('grange') },
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
    case 'laiterie':
      return [
        { cle: 'lait', titre: B.lait, icone: 'water', route: ROUTES.PRODUCTION_LAIT },
        {
          cle: 'qualite',
          titre: B.qualite,
          icone: 'flask',
          route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
        },
        { cle: 'recolteur', titre: B.recolteur, icone: 'people', route: ROUTES.PRODUCTION_LAITERIE },
        {
          cle: 'facture',
          titre: B.factureLait,
          icone: 'add-circle',
          route: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.LAIT}`,
        },
      ];
    case 'fournisseurs':
      return [
        { cle: 'aliments', titre: L.aliments.titre, icone: 'nutrition', route: ROUTES.lieu('aliments') },
        { cle: 'carburant', titre: L.carburant.titre, icone: 'car', route: ROUTES.lieu('carburant') },
        { cle: 'contacts', titre: B.contacts, icone: 'people', route: ROUTES.CONTACTS },
        { cle: 'nouveau', titre: B.nouveauContact, icone: 'add-circle', route: ROUTES.CONTACT_NOUVEAU },
      ];
    case 'contacts':
      return [
        { cle: 'commerce', titre: B.clients, icone: 'cart', route: ROUTES.lieu('commercial') },
        { cle: 'contacts', titre: B.contacts, icone: 'people', route: ROUTES.CONTACTS },
        { cle: 'nouveau', titre: B.nouveauContact, icone: 'add-circle', route: ROUTES.CONTACT_NOUVEAU },
      ];
    case 'abattoir':
      // Quatre actions distinctes : amener des animaux, les lots (« à facturer » est un onglet de la même page, et le badge du bouton le dit), vendre la
      // viande, et la page de l'abattoir (contacts et écritures). Le stock de viande se voit dans le travail du produit.
      return [
        {
          cle: 'abattoir',
          titre: B.abattoir,
          icone: 'cut',
          // Une nouvelle facture de l'abattoir (le premier contact de cette catégorie, d'office) : « Suivant » mène au choix des animaux.
          route: `${NOUVELLE}?type=recue&depense=${CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE}&abattoirContact=1`,
        },
        ...bullesDuLieuATiers('abattoir').filter((bulle) => ['lots', 'page', 'nouvelle'].includes(bulle.cle)),
      ];
    default: {
      const lieu = LIEU_A_TIERS[cible];
      return lieu ? bullesDuLieuATiers(lieu) : [];
    }
  }
}
