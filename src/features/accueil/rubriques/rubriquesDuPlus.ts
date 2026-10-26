import type { Ionicons } from '@expo/vector-icons';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';

type Icone = keyof typeof Ionicons.glyphMap;

/** Une ligne d'une page de rubrique : un écran, avec son titre, ce qu'on y trouve, et son icône. */
export interface LigneRubrique {
  libelle: string;
  aide: string;
  icone: Icone;
  route: string;
}

/** Un groupe de lignes sous un titre. */
export interface SectionRubrique {
  titre: string;
  lignes: LigneRubrique[];
}

/** Une page de rubrique du mode avancé : son titre, sa phrase d'accroche, et ses groupes de lignes (comme sur la maquette). */
export interface Rubrique {
  titre: string;
  sousTitre: string;
  sections: SectionRubrique[];
}

/** Les rubriques du menu « Plus », dans l'ordre de la maquette. */
export const RUBRIQUES_DU_PLUS = [
  { cle: 'reglementation', libelle: 'Réglementation', aide: 'Cadre, étiquetage, agrément, analyses', icone: 'shield-checkmark-outline' },
  { cle: 'argent', libelle: 'Argent', aide: 'Factures, ventes, banque, assurance', icone: 'cash-outline' },
  { cle: 'partenaires', libelle: 'Partenaires', aide: 'Abattoir, équarrissage, clients', icone: 'people-outline' },
  { cle: 'bilans', libelle: 'Bilans', aide: 'Bilan annuel, rentabilité, export', icone: 'stats-chart-outline' },
  { cle: 'historique', libelle: 'Historique', aide: 'Naissances, soins, lots, ventes', icone: 'time-outline' },
  { cle: 'reglages', libelle: 'Réglages', aide: 'Année, Synchronisation, imprimante, mode', icone: 'settings-outline' },
] as const satisfies readonly { cle: string; libelle: string; aide: string; icone: Icone }[];

/** Les pages de rubrique, par leur clé (la clé de la rubrique du menu « Plus », et « mouvement » qui s'ouvre depuis les chèvres). */
export const RUBRIQUES: Record<string, Rubrique> = {
  reglementation: {
    titre: 'Réglementation',
    sousTitre: 'Ce qu’il faut pour vendre',
    sections: [
      {
        titre: 'Ce qu’il faut savoir',
        lignes: [
          { libelle: 'Cadre réglementaire', aide: 'Vue d’ensemble des obligations', icone: 'shield-checkmark-outline', route: ROUTES.CADRE_REGLEMENTAIRE_ATELIER },
          { libelle: 'Documents', aide: 'Pièces jointes et justificatifs', icone: 'document-outline', route: ROUTES.CHEPTEL_BIBLIOTHEQUE },
          { libelle: 'Documents de circulation', aide: 'Ovins et caprins : à déposer', icone: 'swap-horizontal-outline', route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION },
          { libelle: 'Documents d’identification', aide: 'Document d’identification et d’installation', icone: 'card-outline', route: ROUTES.DOCUMENTS_IDENTIFICATION },
        ],
      },
      {
        titre: 'Animaux et lait',
        lignes: [
          { libelle: 'Boucles', aide: 'Les numéros de boucle des animaux', icone: 'pricetag-outline', route: ROUTES.lieu('boucles') },
          { libelle: 'Contrôles des animaux', aide: 'Identification et registre d’élevage', icone: 'checkmark-circle-outline', route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.ANIMAUX) },
          { libelle: 'Terrains', aide: 'Contrôles de surface', icone: 'map-outline', route: ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE) },
          { libelle: 'Dossier PAC', aide: 'Suivi, bordereaux, recensement', icone: 'document-text-outline', route: ROUTES.CHEPTEL_DOSSIER_PAC },
          { libelle: 'Contrôle laitier', aide: 'La qualité du lait', icone: 'water-outline', route: ROUTES.santeControles('laitier') },
        ],
      },
      {
        titre: 'Analyses et rappels',
        lignes: [
          { libelle: 'Analyses', aide: 'Lait, fromages', icone: 'flask-outline', route: ROUTES.santeControles('analyse') },
          { libelle: 'Registre des analyses', aide: 'Résultats par lot et par date', icone: 'list-outline', route: ROUTES.PRODUCTION_REGISTRE_ANALYSES },
          { libelle: 'Rappels de lots', aide: 'Lots à rappeler et rappels faits', icone: 'notifications-outline', route: ROUTES.PRODUCTION_RAPPELS_LOTS },
          { libelle: 'Export pour un contrôle', aide: 'Registre complet en un fichier', icone: 'download-outline', route: ROUTES.EXPORT_DONNEES },
        ],
      },
    ],
  },
  argent: {
    titre: 'Argent',
    sousTitre: 'Entrées et sorties',
    sections: [
      {
        titre: 'Factures et ventes',
        lignes: [
          { libelle: 'Écritures', aide: 'Toutes les factures et ventes', icone: 'list-outline', route: ROUTES.COMPTABILITE_LISTE },
          { libelle: 'Nouvelle facture', aide: 'Photo ou saisie', icone: 'add-circle-outline', route: ROUTES.COMPTABILITE_NOUVELLE },
          { libelle: 'Ventes', aide: 'Atelier et visites', icone: 'cash-outline', route: ROUTES.COMMERCIAL_VENTES },
          { libelle: 'Commandes', aide: 'Commandes et livraisons', icone: 'cart-outline', route: ROUTES.COMMERCIAL_COMMANDES },
          { libelle: 'Circuits de vente', aide: 'Ferme, marché, panier', icone: 'storefront-outline', route: ROUTES.COMMERCIAL_CIRCUITS },
        ],
      },
      {
        titre: 'Comptes et véhicules',
        lignes: [
          { libelle: 'Banque et comptabilité', aide: 'Comptes, comptable', icone: 'business-outline', route: ROUTES.COMPTABILITE_TRESORERIE },
          { libelle: 'Plan comptable', aide: 'Tous les comptes, pour choisir en cas de doute', icone: 'list-outline', route: ROUTES.PLAN_COMPTABLE },
          { libelle: 'Fiscalité', aide: 'Impôts, TVA, RSA', icone: 'calculator-outline', route: ROUTES.FISCALITE },
          { libelle: 'Garage', aide: 'Véhicules et entretien', icone: 'car-outline', route: ROUTES.FLOTTE },
          { libelle: 'Assurance', aide: 'Contrats et échéances', icone: 'shield-checkmark-outline', route: ROUTES.lieu('assurance') },
          { libelle: 'Export comptable', aide: 'Fichier pour le comptable', icone: 'download-outline', route: ROUTES.EXPORT_DONNEES },
        ],
      },
    ],
  },
  partenaires: {
    titre: 'Partenaires',
    sousTitre: 'Ceux avec qui vous travaillez',
    sections: [
      {
        titre: 'Abattoir et équarrissage',
        lignes: [
          { libelle: 'Abattoir', aide: 'Départs et retours de carcasses', icone: 'business-outline', route: ROUTES.lieu('abattoir') },
          { libelle: 'Équarrissage', aide: 'Enlèvements', icone: 'trash-outline', route: ROUTES.ENLEVEMENTS },
          { libelle: 'Organismes', aide: 'Organismes et associations', icone: 'business-outline', route: ROUTES.lieu('organismes') },
          { libelle: 'Groupement sanitaire', aide: 'Vétérinaire et protocoles', icone: 'shield-outline', route: '/commercial/partenaires' },
        ],
      },
      {
        titre: 'Clients et fournisseurs',
        lignes: [
          { libelle: 'Clients', aide: 'Particuliers et professionnels', icone: 'people-outline', route: ROUTES.CLIENTS },
          { libelle: 'Fournisseurs', aide: 'Emballages, ferments, aliments', icone: 'cube-outline', route: ROUTES.FOURNISSEURS },
          { libelle: 'Contacts', aide: 'Tous les contacts', icone: 'person-circle-outline', route: ROUTES.CONTACTS },
        ],
      },
    ],
  },
  bilans: {
    titre: 'Bilans',
    sousTitre: 'Les chiffres de l’année',
    sections: [
      {
        titre: 'Bilans',
        lignes: [
          { libelle: 'Bilan annuel', aide: 'Chèvres, atelier, visites', icone: 'stats-chart-outline', route: ROUTES.CHEPTEL_BILAN },
          { libelle: 'Tableau de bord du cheptel', aide: 'Pyramide des âges et mouvements', icone: 'bar-chart-outline', route: ROUTES.CHEPTEL_TABLEAU_DE_BORD },
          { libelle: 'Rentabilité de l’atelier', aide: 'Coût et marge par produit', icone: 'trending-up-outline', route: ROUTES.RENTABILITE },
          { libelle: 'Statistiques de production', aide: 'Lait, fromages, viande', icone: 'pie-chart-outline', route: ROUTES.PRODUCTION_STATISTIQUES },
          { libelle: 'Alimentation', aide: 'Ce que mangent les animaux', icone: 'nutrition-outline', route: ROUTES.SANTE_ALIMENTATION },
          { libelle: 'Export', aide: 'PDF ou tableur', icone: 'download-outline', route: ROUTES.EXPORT_DONNEES },
        ],
      },
    ],
  },
  historique: {
    titre: 'Historique',
    sousTitre: 'Tout ce qui a été saisi',
    sections: [
      {
        titre: 'Animaux',
        lignes: [
          { libelle: 'À compléter', aide: 'Naissances et morts saisies sur le terrain', icone: 'create-outline', route: ROUTES.CHEPTEL_A_COMPLETER },
          { libelle: 'Naissances', aide: 'Mises bas, portée par portée', icone: 'heart-outline', route: ROUTES.CHEPTEL_NAISSANCES },
          { libelle: 'Sorties et morts', aide: 'Vendues, abattues, mortes', icone: 'exit-outline', route: ROUTES.CHEPTEL_HISTORIQUE },
          { libelle: 'Soins et traitements', aide: 'Par animal et par date', icone: 'medkit-outline', route: ROUTES.CHEPTEL_TRAITEMENTS },
          { libelle: 'Lots d’animaux', aide: 'Groupes nommés', icone: 'layers-outline', route: ROUTES.CHEPTEL_LOTS },
          { libelle: 'Ventes d’animaux vivants', aide: 'Acheteurs et documents', icone: 'cash-outline', route: ROUTES.VENTES_VIVANTS },
          { libelle: 'Grange', aide: 'Foin, aliments et stock', icone: 'home-outline', route: ROUTES.lieu('grange') },
        ],
      },
      {
        titre: 'Atelier',
        lignes: [
          { libelle: 'Lots de l’atelier', aide: 'Fabriqués, contrôlés, rappelés', icone: 'cube-outline', route: ROUTES.PRODUCTION_LOTS },
          { libelle: 'Lait par animal', aide: 'Lait et traites', icone: 'water-outline', route: ROUTES.PRODUCTION_LAIT },
          { libelle: 'Viande', aide: 'Ventes et lots de viande', icone: 'restaurant-outline', route: ROUTES.PRODUCTION_VIANDE },
          { libelle: 'Stock', aide: 'Toutes les catégories : fromages, viande, aliments, boucles…', icone: 'cube-outline', route: ROUTES.COMPTABILITE_STOCKS },
        ],
      },
      {
        titre: 'Rappels',
        lignes: [
          { libelle: 'Historique des rappels', aide: 'Rappels validés, à remettre à valider', icone: 'time-outline', route: ROUTES.RAPPELS_HISTORIQUE },
        ],
      },
    ],
  },
  reglages: {
    titre: 'Réglages',
    sousTitre: 'Mon exploitation',
    sections: [
      {
        titre: 'Exploitation',
        lignes: [
          { libelle: 'Établissement', aide: 'Mon exploitation, SIRET, tarifs', icone: 'business-outline', route: ROUTES.ORGANISATION_ETABLISSEMENT },
          { libelle: 'Synchronisation', aide: 'Serveur de la ferme, entre les téléphones', icone: 'cloud-outline', route: ROUTES.GOOGLE_DRIVE },
          { libelle: 'Sauvegarde et export', aide: 'Fichier de secours', icone: 'save-outline', route: ROUTES.ORGANISATION_DONNEES },
          { libelle: 'Réglages du cheptel', aide: 'UGB, primes, effectif déclaré', icone: 'settings-outline', route: ROUTES.CHEPTEL_REGLAGES },
          { libelle: 'Recettes de l’atelier', aide: 'Fromages, charcuterie, plats, savons', icone: 'book-outline', route: ROUTES.PRODUCTION_RECETTES },
          { libelle: 'Tous les réglages', aide: 'Année, mode, options', icone: 'options-outline', route: ROUTES.REGLAGES },
        ],
      },
    ],
  },
  // Ce que le mode avancé fait d'un mouvement d'animaux : ouverte depuis la tuile « Mouvement » des chèvres.
  mouvement: {
    titre: 'Mouvement',
    sousTitre: 'Entrées, sorties, vente',
    sections: [
      {
        titre: 'Entrées',
        lignes: [{ libelle: 'Entrée d’un animal', aide: 'Achat ou arrivée au troupeau', icone: 'enter-outline', route: ROUTES.CHEPTEL_NOUVELLE }],
      },
      {
        titre: 'Sorties',
        lignes: [
          { libelle: 'Vente vivante', aide: 'Acheteur et document de circulation', icone: 'cash-outline', route: ROUTES.VENTES_VIVANTS },
          { libelle: 'Envoi à l’abattoir', aide: 'Départ d’un lot d’animaux', icone: 'exit-outline', route: ROUTES.lotAbattoirNouveau() },
          { libelle: 'Sortie ou mort', aide: 'Déclarer un décès, avec sa cause', icone: 'close-circle-outline', route: ROUTES.CHEPTEL_DECES },
        ],
      },
    ],
  },
};

/** Une tuile de la rubrique Visites : la visite à créer d'abord (remplie en vert, la principale), puis les visites du jour et le reste. */
export interface TuileVisites {
  libelle: string;
  aide: string;
  icone: Icone;
  route: string;
  principale?: boolean;
}

/** Les tuiles de la rubrique Visites, comme sur la maquette (Windows les reprend dans son menu Visites). */
export const TUILES_VISITES: TuileVisites[] = [
  { libelle: 'Nouvelle visite', aide: 'Date, personnes, formule', icone: 'add', route: ROUTES.COMMERCIAL_VISITE, principale: true },
  { libelle: 'Aujourd’hui', aide: 'Visites du jour', icone: 'calendar-outline', route: ROUTES.COMMERCIAL_AGRITOURISME },
  { libelle: 'Encaisser', aide: 'Montant et paiement', icone: 'cash-outline', route: ROUTES.commercialVentes('encaisser') },
  { libelle: 'Repas', aide: 'Formules et réservations', icone: 'restaurant-outline', route: ROUTES.COMMERCIAL_FORMULES },
  { libelle: 'Groupes', aide: 'Cars et associations', icone: 'people-outline', route: ROUTES.COMMERCIAL_GROUPES },
  { libelle: 'Tarifs', aide: 'Prix des formules', icone: 'pricetag-outline', route: ROUTES.COMMERCIAL_TARIFS },
  { libelle: 'Accueil du public', aide: 'Obligations et informations', icone: 'information-circle-outline', route: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC },
];

/** Le titre d'une page de rubrique (celui de la barre du haut), ou une chaîne vide quand la rubrique n'existe pas. */
export const titreDeLaRubrique = (nom: string | undefined): string => (nom && RUBRIQUES[nom] ? RUBRIQUES[nom].titre : '');
