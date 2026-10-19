import type { Ionicons } from '@expo/vector-icons';
import type { CleLieu } from '@/features/accueil/services/carteFerme';
import { LIEUX_TIERS, type CleLieuTiers } from '@/features/accueil/services/lieuxTiers';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

/** Une bulle d'action autour d'un lieu de la carte : son icône, son nom, et l'écran qu'elle ouvre. */
export interface ActionDeLieu {
  cle: string;
  titre: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
}

/** Le lieu dont les bulles s'ouvrent : un lieu de la carte, ou l'enclos du troupeau. */
export type CibleDesBulles = CleLieu | 'enclos';

const B = TEXTES.accueil.ferme.bulles;
const L = TEXTES.production.lieux;
const NOUVELLE = ROUTES.COMPTABILITE_NOUVELLE;

/** Le lieu à tiers (sa page, ses rubriques) qui correspond à un lieu de la carte, quand il y en a un. */
const LIEU_A_TIERS: Partial<Record<CleLieu, CleLieuTiers>> = {
  foin: 'aliments',
  organismes: 'organismes',
  pompe: 'carburant',
  veterinaire: 'veterinaire',
  equarrissage: 'equarrissage',
  abattoir: 'abattoir',
  charcuterie: 'boucherie',
  entrepot: 'entrepot',
  commercial: 'commercial',
};

/** Combien de rubriques d'un lieu à tiers passent en bulles (en plus de sa page et de « Nouvelle facture »). */
const RUBRIQUES_EN_BULLES = 3;

/** Les bulles d'un lieu à tiers : ses premières rubriques, sa page (contacts et écritures) et « Nouvelle facture ». */
function bullesDuLieuATiers(cle: CleLieuTiers): ActionDeLieu[] {
  const config = LIEUX_TIERS[cle];
  const textes = L[cle];
  const liens = textes.liens as Record<string, { titre: string }>;
  const rubriques = config.liens.slice(0, config.avecTiers ? RUBRIQUES_EN_BULLES : 5).map((l) => ({
    cle: l.cle,
    titre: liens[l.cle]?.titre ?? l.cle,
    icone: l.icone,
    route: l.route,
  }));
  if (!config.avecTiers) return rubriques;
  const nouvelle = (textes as { nouvelle?: string }).nouvelle ?? '';
  return [
    ...rubriques,
    { cle: 'page', titre: B.contactsEtEcritures, icone: 'people', route: ROUTES.lieu(cle) },
    { cle: 'nouvelle', titre: nouvelle, icone: 'add-circle', route: config.nouvelle },
  ];
}

/** Les actions qui sortent en bulles quand on touche un lieu de la carte (ou l'enclos) : les écrans qu'on y ouvre le plus. */
export function actionsDuLieu(cible: CibleDesBulles): ActionDeLieu[] {
  switch (cible) {
    case 'enclos':
      return [
        { cle: 'animaux', titre: B.animaux, icone: 'paw', route: ROUTES.CHEPTEL_LISTE },
        { cle: 'naissances', titre: B.naissances, icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCES },
        { cle: 'lots', titre: B.lots, icone: 'layers', route: ROUTES.CHEPTEL_LOTS },
        { cle: 'traitements', titre: B.traitements, icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENTS },
        { cle: 'cheptel', titre: B.menuCheptel, icone: 'list', route: ROUTES.CHEPTEL },
      ];
    case 'laiterie':
      return [
        { cle: 'lait', titre: B.lait, icone: 'water', route: ROUTES.PRODUCTION_LAIT },
        { cle: 'qualite', titre: B.qualite, icone: 'flask', route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER) },
        { cle: 'recolteur', titre: B.recolteur, icone: 'people', route: ROUTES.PRODUCTION_LAITERIE },
        { cle: 'facture', titre: B.factureLait, icone: 'add-circle', route: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.LAIT}` },
      ];
    case 'fromagerie':
      return [
        { cle: 'fromages', titre: B.fromages, icone: 'restaurant', route: ROUTES.PRODUCTION_FROMAGES },
        { cle: 'fabriquer', titre: B.fabriquer, icone: 'flask', route: ROUTES.productionFabrication(PRODUIT_A_LOTS.FROMAGE) },
        { cle: 'rappeler', titre: B.rappeler, icone: 'notifications', route: ROUTES.productionRappel(PRODUIT_A_LOTS.FROMAGE) },
        { cle: 'vendre', titre: B.vendreFromage, icone: 'add-circle', route: `${NOUVELLE}?type=emise&categorie=${CATEGORIE_RECETTE.FROMAGE}` },
      ];
    case 'contacts':
      return [
        { cle: 'contacts', titre: B.contacts, icone: 'people', route: ROUTES.CONTACTS },
        { cle: 'nouveau', titre: B.nouveauContact, icone: 'add-circle', route: ROUTES.CONTACT_NOUVEAU },
      ];
    default: {
      const lieu = LIEU_A_TIERS[cible];
      return lieu ? bullesDuLieuATiers(lieu) : [];
    }
  }
}
