import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const C = TEXTES.accueil.ferme.colonnes;

/**
 * Les boutons qui ouvrent directement leur page, sans bulles : les fiches des intervenants (leurs contacts, leurs factures et toutes leurs actions),
 * et les pages de la gestion. Le suivi des mouvements, le bordereau de perte et le recensement se génèrent depuis le dossier PAC, qui garde leur
 * année et leur état.
 */
export const ROUTE_DIRECTE: Record<string, string> = {
  // La gestion de l'exploitation : le cheptel (liste, lots, ajouts, boucles, carnet de naissance) et les documents.
  // Le cheptel : directement la liste des animaux (les lots s'ouvrent depuis l'icône de son en-tête).
  cheptel: ROUTES.lieu('animaux'),
  documents: ROUTES.lieu('documents'),
  organismes: ROUTES.lieu('organismes'),
  // Les intervenants de l'exploitation.
  abattoir: ROUTES.lieu('abattoir'),
  // Les partenaires (organismes, assureurs, équarrisseurs, contacts) : l'écran où ils sont tous rangés ; le vétérinaire est dans le groupement sanitaire.
  partenaires: ROUTES.santeControles(FAMILLE_CONTROLE.GROUPEMENT),
  bilanAnnuel: ROUTES.CHEPTEL_BILAN,
  // Un animal qui part vivant (vendu à un particulier, à un autre éleveur…) : l'assistant du départ, avec son document de circulation.
  venteVivant: ROUTES.lotAbattoirNouveau('vivants'),
  // Une nouvelle dépense : la facture reçue (la catégorie — aliments, carburant, réparation… — se choisit dans l'écriture).
  nouvelleFacture: `${ROUTES.COMPTABILITE_NOUVELLE}?type=recue`,
  aliments: ROUTES.lieu('aliments'),
  equarrissage: ROUTES.lieu('equarrissage'),
  carburant: ROUTES.lieu('carburant'),
  garage: ROUTES.lieu('garage'),
  assurance: ROUTES.lieu('assurance'),
  banque: ROUTES.lieu('banque'),
  groupement: ROUTES.lieu('groupement'),
  groupementSanitaire: ROUTES.lieu('groupementSanitaire'),
  // Les intervenants du travail du produit : la laiterie, les clients par catégorie, les emballages.
  emballages: ROUTES.lieu('emballages'),
  laiterie: ROUTES.PRODUCTION_LAITERIE,
  particuliers: ROUTES.lieu('particuliers'),
  surfacesCommerciales: ROUTES.lieu('surfacesCommerciales'),
  entreprises: ROUTES.lieu('entreprises'),
  // Les analyses : celles du lait, du fromage et de la charcuterie.
  analyses: ROUTES.lieu('analyses'),
  // Le registre des analyses de l'atelier : les fabrications et leurs analyses.
  registreAnalyses: ROUTES.PRODUCTION_REGISTRE_ANALYSES,
  // La bibliothèque de recettes de l'atelier.
  recettes: ROUTES.PRODUCTION_RECETTES,
  // La gestion du travail du produit : fabriquer, les lots, leurs rappels, la réservation d'un produit, et le stock de la fromagerie.
  reserver: ROUTES.COMMERCIAL_COMMANDE,
  stockFromagerie: `${ROUTES.COMPTABILITE_STOCKS}?vue=atelier`,
  // Le côté Agritourisme : les intervenants (visiteurs, groupes, office de tourisme, repas) et les pages de la gestion (visites, formules, tarifs, ventes, rentabilité).
  visiteurs: ROUTES.lieu('visiteurs'),
  groupesVisiteurs: ROUTES.lieu('groupesVisiteurs'),
  tourisme: ROUTES.lieu('tourisme'),
  repas: ROUTES.lieu('repas'),
  // Les démarches pour accueillir du public (ERP, sécurité incendie, accessibilité, assurance, DDPP).
  cadreReglementaire: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC,
  nouvelleVisite: ROUTES.COMMERCIAL_VISITE,
  visites: ROUTES.COMMERCIAL_AGRITOURISME,
  formules: ROUTES.COMMERCIAL_FORMULES,
  tarifs: ROUTES.COMMERCIAL_TARIFS,
  // Les ventes de l'agritourisme : les visites réalisées, pas les produits de l'atelier.
  ventesAgritourisme: `${ROUTES.COMMERCIAL_VENTES}?perimetre=agritourisme`,
  // Les ventes de l'atelier : ce qu'on fabrique et vend (fromage, charcuterie, viande), sans les animaux ni le lait.
  ventesAtelier: `${ROUTES.COMMERCIAL_VENTES}?perimetre=atelier`,
  // La rentabilité du côté Agritourisme ne porte que sur l'agritourisme ; celle de l'atelier, que sur ce qu'on fabrique (lait, fromage, viande, charcuterie).
  rentabilite: `${ROUTES.RENTABILITE}?perimetre=agritourisme`,
  rentabiliteAtelier: `${ROUTES.RENTABILITE}?perimetre=atelier`,
};

/**
 * Les pages que les anciens menus (Production, Commercial) proposaient encore à côté de celles de l'accueil, et qu'on n'y ajoute plus : chacune s'ouvre déjà d'un bouton
 * ou d'un lien de l'accueil — les lots (fromages, viande, charcuterie), la laiterie (la production de lait), les analyses (le lait, le fromage, la charcuterie, les plats,
 * les savons) et les fiches des clients (le chiffre d'affaires, les commandes, les circuits). Un test vérifie que le lien existe encore.
 */
export const ENTREES_RETIREES_DES_MENUS: readonly string[] = [
  ROUTES.PRODUCTION_FROMAGES,
  ROUTES.PRODUCTION_VIANDE,
  ROUTES.PRODUCTION_CHARCUTERIE,
  ROUTES.PRODUCTION_LAIT,
  ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
  ROUTES.analysesProduit('fromage'),
  ROUTES.analysesProduit('charcuterie'),
  ROUTES.analysesProduit('plat'),
  ROUTES.analysesProduit('savon'),
  ROUTES.COMMERCIAL_VENTES,
  ROUTES.COMMERCIAL_COMMANDES,
  ROUTES.COMMERCIAL_CIRCUITS,
];

/**
 * Les boutons de l'accueil « ferme » de chaque côté, dans l'ordre où l'accueil les montre : le nom de leur libellé, leur clé dans `ROUTE_DIRECTE`, ou leurs bulles
 * (la grange, les lots, fabriquer). Les menus du haut du téléphone et du mobile pour PC reprennent cette organisation : un seul plan pour l'accueil et pour les menus.
 */
export const BOUTONS_DE_LA_FERME = {
  exploitation: {
    gestion: [
      ['cheptel', C.cheptel],
      ['grange', C.grange],
      ['documents', C.documents],
      ['organismes', C.organismes],
      ['bilanAnnuel', C.bilanAnnuel],
      ['venteVivant', C.venteVivant],
    ],
    intervenants: [
      ['nouvelleFacture', C.nouvelleFacture],
      ['abattoir', C.abattoir],
      ['equarrissage', C.equarrissage],
      ['garage', C.garage],
      ['assurance', C.assurance],
      ['banque', C.banque],
      ['groupement', C.groupement],
      ['groupementSanitaire', C.groupementSanitaire],
    ],
  },
  transformation: {
    gestion: [
      ['stockFromagerie', C.stock],
      ['reserver', C.reserver],
      ['lots', C.lotsAtelier],
      ['fabriquer', C.fabriquer],
      ['ventesAtelier', C.ventesAtelier],
      ['rentabiliteAtelier', C.rentabilite],
      ['registreAnalyses', C.registreAnalyses],
      ['recettes', C.recettes],
    ],
    intervenants: [
      ['laiterie', C.laiterie],
      ['particuliers', C.particuliers],
      ['entreprises', C.entreprises],
      ['emballages', C.emballages],
      ['analyses', C.analyses],
    ],
  },
  agritourisme: {
    gestion: [
      ['nouvelleVisite', C.nouvelleVisite],
      ['visites', C.visites],
      ['formules', C.formules],
      ['tarifs', C.tarifs],
      ['ventesAgritourisme', C.ventesAgritourisme],
      ['rentabilite', C.rentabilite],
    ],
    intervenants: [
      ['visiteurs', C.visiteurs],
      ['groupesVisiteurs', C.groupesVisiteurs],
      ['repas', C.repas],
      ['tourisme', C.tourisme],
      ['cadreReglementaire', C.cadreReglementaire],
    ],
  },
} as const satisfies Record<string, { gestion: readonly (readonly [string, string])[]; intervenants: readonly (readonly [string, string])[] }>;
