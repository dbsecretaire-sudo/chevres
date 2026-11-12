import type { Ionicons } from '@expo/vector-icons';
import { FAMILLE_CONTROLE, ONGLET_SANTE } from '@/shared/constants/controles';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
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
  { cle: 'partenaires', libelle: 'Partenaires', aide: 'Abattoir, équarrissage, clients', icone: 'people-outline' },
  { cle: 'bilans', libelle: 'Bilans', aide: 'Bilan annuel, rentabilité, export', icone: 'stats-chart-outline' },
  { cle: 'historique', libelle: 'Historique', aide: 'Naissances, soins, lots, ventes', icone: 'time-outline' },
  { cle: 'reglages', libelle: 'Réglages', aide: 'Année, Synchronisation, imprimante, mode', icone: 'settings-outline' },
] as const satisfies readonly { cle: string; libelle: string; aide: string; icone: Icone }[];

/** Les pages de rubrique, par leur clé (la clé de la rubrique du menu « Plus », et « mouvement » qui s'ouvre depuis les chèvres). */
export const RUBRIQUES: Record<string, Rubrique> = {
  // La santé des chèvres : le groupement sanitaire (GDS), le vétérinaire, les traitements, et les lots de reproduction, d'avortement et de renouvellement.
  sante: {
    titre: 'Santé',
    sousTitre: 'Ce qui touche à la santé du troupeau',
    sections: [
      {
        titre: 'Groupement sanitaire (GDS)',
        lignes: [
          { libelle: 'GDS', aide: 'Cotisations, versements et contacts', icone: 'shield-checkmark-outline', route: ROUTES.lieu('groupementSanitaire') },
          { libelle: 'Documents du GDS', aide: 'Campagnes et attestations', icone: 'document-text-outline', route: ROUTES.DOCUMENTS_GDS },
        ],
      },
      {
        titre: 'Vétérinaire',
        lignes: [
          { libelle: 'Vétérinaire', aide: 'Contact, factures et visites', icone: 'medical-outline', route: ROUTES.lieu('veterinaire') },
          { libelle: 'Visites du vétérinaire', aide: 'Ses visites et ses rapports d’essais', icone: 'medical-outline', route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, ONGLET_SANTE) },
        ],
      },
      {
        titre: 'Traitements',
        lignes: [
          { libelle: 'Traitements', aide: 'Soins donnés et délais d’attente', icone: 'medkit-outline', route: ROUTES.CHEPTEL_TRAITEMENTS },
          { libelle: 'Nouveau traitement', aide: 'Un soin donné à un animal ou à un lot', icone: 'add-circle-outline', route: ROUTES.CHEPTEL_TRAITEMENT_NOUVEAU },
          { libelle: 'Qualité du lait', aide: 'Analyses, résumé et contrôles du lait', icone: 'water-outline', route: ROUTES.santeControlesOnglet('laitier', 'analyse') },
        ],
      },
      {
        titre: 'Alimentation',
        lignes: [
          { libelle: 'Aliments', aide: 'Rations et aliments des animaux', icone: 'nutrition-outline', route: ROUTES.SANTE_ALIMENTATION },
        ],
      },
      {
        titre: 'Reproduction',
        lignes: [
          { libelle: 'Mise à la reproduction', aide: 'Les femelles mises à la reproduction', icone: 'heart-outline', route: ROUTES.lotsDeLaCategorie(CATEGORIE_LOT.REPRODUCTION) },
          { libelle: 'Avortements', aide: 'Les femelles qui ont avorté', icone: 'alert-circle-outline', route: ROUTES.lotsDeLaCategorie(CATEGORIE_LOT.AVORTEMENT) },
          { libelle: 'Renouvellement', aide: 'Les animaux désignés pour le renouvellement', icone: 'refresh-outline', route: ROUTES.lotsDeLaCategorie(CATEGORIE_LOT.RENOUVELLEMENT) },
        ],
      },
    ],
  },
  // Le commerce de la ferme : les ventes, les commandes et les circuits, puis la viande et les animaux vendus. C'est la page « Commerce » de la Ferme.
  commerce: {
    titre: 'Commerce',
    sousTitre: 'Ce qui se vend',
    sections: [
      {
        titre: 'Commandes et circuits',
        lignes: [
          { libelle: 'Commandes', aide: 'Commandes et bons', icone: 'cart-outline', route: ROUTES.COMMERCIAL_COMMANDES },
          { libelle: 'Circuit de vente', aide: 'Ce que rapporte chaque circuit', icone: 'storefront-outline', route: ROUTES.COMMERCIAL_CIRCUITS },
          { libelle: 'Tarifs', aide: 'Prix des produits', icone: 'pricetag-outline', route: ROUTES.COMMERCIAL_TARIFS },
        ],
      },
      {
        titre: 'Viande et animaux',
        lignes: [
          { libelle: 'Viande et animaux vendus', aide: 'À facturer, facturés, vendus', icone: 'restaurant-outline', route: ROUTES.PRODUCTION_VIANDE },
          { libelle: 'Ventes d’animaux vivants', aide: 'Acheteurs et documents', icone: 'cash-outline', route: ROUTES.VENTES_VIVANTS },
        ],
      },
    ],
  },
  // Les documents, par usage : ce qu'on présente, ce qu'on imprime, ce qu'on envoie. C'est la page « Documents » de la Ferme.
  documents: {
    titre: 'Documents',
    sousTitre: 'Ce qu’il faut présenter, imprimer ou envoyer',
    sections: [
      {
        titre: 'À présenter',
        lignes: [
          { libelle: 'Registre des analyses', aide: 'Résultats par lot et par date', icone: 'list-outline', route: ROUTES.PRODUCTION_REGISTRE_ANALYSES },
          { libelle: 'Rappels de lots', aide: 'Lots à rappeler et rappels faits', icone: 'notifications-outline', route: ROUTES.PRODUCTION_RAPPELS_LOTS },
          { libelle: 'Cadre réglementaire', aide: 'Vue d’ensemble des obligations', icone: 'shield-checkmark-outline', route: ROUTES.CADRE_REGLEMENTAIRE_ATELIER },
          { libelle: 'Dossier PAC', aide: 'Suivi, bordereaux, recensement', icone: 'document-text-outline', route: ROUTES.CHEPTEL_DOSSIER_PAC },
          { libelle: 'Documents de circulation', aide: 'Ovins et caprins : à déposer', icone: 'swap-horizontal-outline', route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION },
          { libelle: 'Documents d’identification', aide: 'Document d’identification et d’installation', icone: 'card-outline', route: ROUTES.DOCUMENTS_IDENTIFICATION },
        ],
      },
      {
        titre: 'À imprimer',
        lignes: [
          { libelle: 'Étiquettes', aide: 'Étiquettes des produits', icone: 'pricetag-outline', route: ROUTES.PRODUCTION_ETIQUETTES_SIMPLE },
          { libelle: 'Accueil du public', aide: 'Obligations et informations', icone: 'information-circle-outline', route: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC },
          { libelle: 'Organismes', aide: 'Groupements, laboratoires, organismes de contrôle', icone: 'business-outline', route: ROUTES.lieu('organismes') },
        ],
      },
      {
        titre: 'À envoyer',
        lignes: [
          { libelle: 'Export pour le comptable', aide: 'Export et PDF', icone: 'server-outline', route: ROUTES.EXPORT_DONNEES },
          { libelle: 'Sauvegarde', aide: 'Fichier de secours', icone: 'save-outline', route: ROUTES.SAUVEGARDE_LOCALE },
        ],
      },
      {
        titre: 'Réglementation et contrôles',
        lignes: [
          { libelle: 'Bibliothèque de documents', aide: 'Pièces jointes et justificatifs', icone: 'document-outline', route: ROUTES.CHEPTEL_BIBLIOTHEQUE },
          { libelle: 'Boucles', aide: 'Les numéros de boucle des animaux', icone: 'pricetag-outline', route: ROUTES.lieu('boucles') },
          { libelle: 'Contrôles des animaux', aide: 'Identification et registre d’élevage', icone: 'checkmark-circle-outline', route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.ANIMAUX) },
          { libelle: 'Terrains', aide: 'Contrôles de surface', icone: 'map-outline', route: ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE) },
          { libelle: 'Qualité du lait', aide: 'Analyses, résumé et contrôles du lait', icone: 'water-outline', route: ROUTES.santeControlesOnglet('laitier', 'analyse') },
        ],
      },
    ],
  },
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
          { libelle: 'Qualité du lait', aide: 'Analyses, résumé et contrôles du lait', icone: 'water-outline', route: ROUTES.santeControlesOnglet('laitier', 'analyse') },
        ],
      },
      {
        titre: 'Analyses et rappels',
        lignes: [
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
        ],
      },
      {
        titre: 'Atelier',
        lignes: [
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
          { libelle: 'Agritourisme (visites)', aide: 'Visites de la ferme, formules et groupes', icone: 'leaf-outline', route: '/visites' },
          { libelle: 'Mon établissement', aide: 'Informations, statut, dossiers des contacts.', icone: 'business-outline', route: ROUTES.ORGANISATION_ETABLISSEMENT },
          { libelle: 'Listes de choix', aide: 'Ce qu’une assurance couvre, les catégories de dépense : ajoutez, masquez.', icone: 'list-outline', route: ROUTES.ORGANISATION_LISTES },
          { libelle: 'Contacts', aide: 'Le carnet d’adresses de vos contacts, leurs catégories et ce qu’elles changent.', icone: 'person-outline', route: ROUTES.ORGANISATION_TIERS },
          { libelle: 'Mes données', aide: 'Export et PDF, sauvegarde, Google Drive.', icone: 'server-outline', route: ROUTES.ORGANISATION_DONNEES },
          { libelle: 'Réglages', aide: 'Les règles que l’application applique aujourd’hui.', icone: 'settings-outline', route: ROUTES.ORGANISATION_REGLES },
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
          { libelle: 'Équarrissage', aide: 'Enlèvement d’un animal mort', icone: 'trash-outline', route: ROUTES.lieu('equarrissage') },
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
  /** Une ligne du menu sous les tuiles, et non une tuile (comme les rubriques de Chèvres). */
  menu?: boolean;
}

/** Les tuiles de la rubrique Visites, comme sur la maquette (Windows les reprend dans son menu Visites). */
export const TUILES_VISITES: TuileVisites[] = [
  { libelle: 'Nouvelle visite', aide: 'Date, personnes, formule', icone: 'add', route: ROUTES.COMMERCIAL_VISITE, principale: true },
  { libelle: 'Aujourd’hui', aide: 'Visites du jour', icone: 'calendar-outline', route: ROUTES.COMMERCIAL_AGRITOURISME },
  { libelle: 'Encaisser', aide: 'Montant et paiement', icone: 'cash-outline', route: ROUTES.commercialVentes('encaisser') },
  { libelle: 'Repas', aide: 'Formules et réservations', icone: 'restaurant-outline', route: ROUTES.COMMERCIAL_FORMULES },
  { libelle: 'Groupes', aide: 'Cars et associations', icone: 'people-outline', route: ROUTES.COMMERCIAL_GROUPES },
  { libelle: 'Tarifs', aide: 'Prix des formules', icone: 'pricetag-outline', route: ROUTES.COMMERCIAL_FORMULES },
  { libelle: 'Accueil du public', aide: 'Obligations et informations', icone: 'information-circle-outline', route: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC, menu: true },
];

/** Le titre d'une page de rubrique (celui de la barre du haut), ou une chaîne vide quand la rubrique n'existe pas. */
export const titreDeLaRubrique = (nom: string | undefined): string => (nom && RUBRIQUES[nom] ? RUBRIQUES[nom].titre : '');

/**
 * Les écrans d'une rubrique, avec leur chemin et, pour un lieu (« ?lieu=assurance »), son identifiant : le Précédent de ces écrans
 * ramène à la rubrique elle-même (Argent, par exemple).
 */
export const entreesDeLaRubrique = (nom: string): { chemin: string; lieu?: string }[] =>
  (RUBRIQUES[nom]?.sections ?? []).flatMap((s) => s.lignes).map((ligne) => {
    const [chemin, requete] = ligne.route.split('?');
    return { chemin, lieu: requete?.match(/lieu=([^&]+)/)?.[1] };
  });

/** Vrai quand l'adresse (et son lieu, s'il y en a un) est un écran de la rubrique : son Précédent est alors la rubrique. */
export const estUnEcranDeLaRubrique = (nom: string, adresse: string, lieu?: string): boolean =>
  entreesDeLaRubrique(nom).some((e) => e.chemin === adresse && (!e.lieu || e.lieu === lieu));
