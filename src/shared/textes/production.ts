import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

/** Les rubriques que proposent les fiches des clients (particuliers, surfaces commerciales, entreprises) : celles du commerce. */
const LIENS_DES_CLIENTS = {
  ventes: { titre: 'Chiffre d’affaires', aide: 'Par produit, par contact et par mois ; paiements en attente.' },
  commandes: { titre: 'Commandes', aide: 'Ce que les contacts ont commandé : à préparer, à livrer, livré.' },
  tarifs: { titre: 'Grille de tarifs', aide: 'Le prix de chaque fromage selon la catégorie de contact, et sa marge.' },
  circuits: { titre: 'Circuits de vente', aide: 'Ce que rapporte chaque circuit : ferme, marché, restaurateurs…' },
};

/** Les rubriques que proposent les fiches des visiteurs de l'agritourisme (visiteurs, groupes). */
const LIENS_DE_LAGRITOURISME = {
  visites: { titre: 'Visites de la ferme', aide: 'Les visites à venir et réalisées, les visiteurs et ce que ça rapporte.' },
  nouvelleVisite: { titre: 'Nouvelle visite', aide: 'Une date, un groupe, une formule : la visite se prépare ici.' },
  formules: { titre: 'Formules et tarifs', aide: 'Ce que comprend chaque formule (visite, 4x4, repas, dégustation) et son prix.' },
};

/** Textes de l'interface — l'onglet Production (fromages, viande vendue, contrôle laitier). À modifier ici uniquement. */
export const TEXTES_PRODUCTION = {
  titre: 'Production',
  /** Les lignes de l'écran d'accueil de l'onglet. */
  accueil: {
    groupes: {
      produit: 'Produit',
      laitier: 'Analyses et contrôle du lait',
      analyses: 'Analyses et contrôles',
      dangereux: 'Gestion des produits dangereux',
    },
    fromages: { titre: 'Fromages', aide: 'Les fromages par lot : fabrication, vente, rappels.' },
    viande: { titre: 'Viande', aide: 'Les ventes de viande de l’année.' },
    oeufs: { titre: 'Œufs', aide: 'Les ventes d’œufs de l’année.' },
    charcuterie: {
      titre: 'Boucherie / Charcuterie',
      aide: 'La boucherie et la charcuterie par lot : fabrication, vente, rappels.',
    },
    laitier: {
      titre: 'Qualité du lait',
      aide: 'Les contrôles de la production et de la qualité du lait, et les analyses.',
    },
    productionLait: {
      titre: 'Production du lait',
      aide: 'Le lait produit par animal et par traite, d’après l’inventaire.',
    },
    officiel: {
      titre: 'Contrôles officiels et autocontrôles',
      aide: 'Les contrôles de l’abattoir (services de l’État) et vos propres autocontrôles.',
    },
    salmonelle: {
      titre: 'Dépistage de la salmonelle',
      aide: 'Les prélèvements de fientes analysés pour la salmonelle.',
    },
    rappels: {
      titre: 'Rappels de lots',
      aide: 'Les lots vendus à rappeler (contrôle non ok) et ceux déjà rappelés.',
    },
  },
  /** La section des rappels de lots : à rappeler, puis rappelés (fromages et charcuterie). */
  rappelsLots: {
    titre: 'Rappels de lots',
    aucun: 'Aucun lot à rappeler ni rappelé.',
    aRappeler: (date: string) => `À rappeler · vendu le ${date}`,
    rappele: (date: string) => `Rappelé le ${date}`,
    rappeleValide: (date: string, validation: string) => `Rappelé le ${date} · validé le ${validation}`,
    valide: 'Rappel validé',
    validerLeRappel: 'Valider ce rappel',
    validerQuestion: (lot: string) => `Valider le rappel du lot ${lot} ?`,
    validerMessage: 'Le rappel sera marqué comme fait.',
    valider: 'Valider',
    /** Le détail d'un lot : le lot, sa facture et le client à contacter. */
    detail: {
      lot: 'Lot',
      fabrication: 'Fabriqué le',
      vente: 'Vendu le',
      rappel: 'Rappel',
      aRappeler: 'À rappeler',
      valideLe: (date: string) => `validé le ${date}`,
      controle: 'Contrôle',
      controleOk: 'Ok',
      controleNonOk: 'Non ok',
      facture: 'Facture',
      pasVendu: 'Ce lot n’a pas été vendu.',
      venteIntrouvable: 'La vente de ce lot est introuvable.',
      numeroFacture: 'N° de facture',
      venteDu: 'Vente du',
      montant: 'Montant',
      ouvrirLaFicheClient: 'Ouvrir la fiche contact',
      client: 'Contact à joindre',
      nom: 'Nom',
      telephone: 'Téléphone',
      email: 'E-mail',
      adresse: 'Adresse',
      pasDeFiche: 'Aucune fiche contact à ce nom : le nom vient de la vente.',
      fermer: 'Fermer',
    },
  },
  /** La liste des fromages : un par type, avec ses lots. */
  fromages: {
    titre: 'Fromages',
    aucun: 'Aucun fromage suivi : fabriquez-en avec le bouton +.',
    ajouter: { titre: 'Ajouter une variété de fromage', exemple: 'ex : Tomme' },
    fabriquer: 'Fabriquer des fromages',
    facturer: 'Facturer des fromages',
    rappeler: 'Rappeler des fromages',
    statistiques: 'Statistiques de lait',
    ligne: (enStock: number, total: number) => `${enStock} en stock · ${total} lot${total > 1 ? 's' : ''}`,
  },
  /** Les réglages d'une liste de lots (fromages, boucherie / charcuterie) : ajouter, remettre à zéro, supprimer les lots. */
  /** La liste de la boucherie / charcuterie : un produit par ligne de l'inventaire, avec ses lots. */
  charcuterie: {
    titre: 'Boucherie / Charcuterie',
    aucun: 'Aucun produit suivi : ajoutez-en avec le bouton +, puis fabriquez-en.',
    ajouter: { titre: 'Ajouter un produit', exemple: 'ex : Saucisson' },
    fabriquer: 'Fabriquer des produits',
    facturer: 'Facturer des produits',
    rappeler: 'Rappeler des produits',
  },
  /** La laiterie : le lait, sa qualité, et tout ce qui concerne le récolteur (ses contacts, ses factures). */
  laiterie: {
    titre: 'Laiterie',
    groupeLait: 'Le lait',
    groupeRecolteur: 'Le récolteur',
    groupeFactures: 'Les factures de lait',
    contacts: 'Contacts du récolteur',
    aucunRecolteur: 'Aucun récolteur dans vos contacts.',
    ajouterRecolteur: 'Ajouter un récolteur',
    aucuneFacture: 'Aucune facture de lait cette année.',
    nouvelleFacture: 'Nouvelle facture de lait',
    toutesLesFactures: 'Toutes les écritures',
    plusDeFactures: (n: number) => `${n} autres factures de lait dans les écritures`,
  },
  /** Les lieux de la carte de la ferme qui ont un tiers : leur page (les contacts du lieu, ses factures, ses rubriques). */
  lieux: {
    groupeLiens: 'Dans l’application',
    aucunTiers: 'Aucun contact pour ce lieu.',
    aucuneEcriture: 'Aucune écriture de ce lieu cette année.',
    plusDEcritures: (n: number) => `${n} autres écritures dans la comptabilité`,
    aliments: {
      titre: 'Aliments',
      groupeTiers: 'Fournisseurs d’aliments',
      ajouterTiers: 'Ajouter un fournisseur d’aliments',
      groupeEcritures: 'Les achats d’aliments',
      nouvelle: 'Nouvelle facture d’aliments',
      liens: {
        stock: { titre: 'Stock d’aliments', aide: 'Les aliments en stock et ce qui reste.' },
        alimentation: { titre: 'Alimentation', aide: 'Ce que mangent les animaux, jour après jour.' },
      },
    },
    carburant: {
      titre: 'Pompe à essence',
      groupeTiers: 'Distributeurs de carburant',
      ajouterTiers: 'Ajouter une station',
      groupeEcritures: 'Les pleins de carburant',
      nouvelle: 'Nouvelle facture de carburant',
      liens: {},
    },
    garage: {
      titre: 'Garage',
      groupeTiers: 'Garages et réparateurs',
      ajouterTiers: 'Ajouter un garage',
      groupeEcritures: 'Les réparations',
      nouvelle: 'Nouvelle facture de réparation',
      liens: {},
    },
    assurance: {
      titre: 'Assurance',
      groupeTiers: 'Assureurs',
      ajouterTiers: 'Ajouter un assureur',
      groupeEcritures: 'Les primes et factures d’assurance',
      nouvelle: 'Nouvelle facture d’assurance',
      liens: {},
    },
    banque: {
      titre: 'Banque et comptabilité',
      groupeTiers: 'Banques',
      ajouterTiers: 'Ajouter une banque',
      groupeEcritures: 'Les frais bancaires',
      nouvelle: 'Nouveaux frais bancaires',
      liens: {
        tresorerie: { titre: 'Trésorerie', aide: 'Solde mois par mois, échéancier, emprunts, alertes.' },
        tva: { titre: 'Pilotage de la TVA', aide: 'La TVA collectée et déductible, par période et par taux.' },
        comptes: { titre: 'Comptes du plan comptable', aide: 'Les comptes qui rangent vos dépenses et vos recettes.' },
      },
    },
    groupement: {
      titre: 'Groupement',
      groupeTiers: 'Groupements d’achats et de producteurs',
      ajouterTiers: 'Ajouter un groupement',
      groupeEcritures: 'Les cotisations et achats groupés',
      nouvelle: 'Nouvelle facture de groupement',
      liens: {},
    },
    groupementSanitaire: {
      titre: 'Groupement sanitaire',
      groupeTiers: 'Groupements sanitaires (GDS)',
      ajouterTiers: 'Ajouter un groupement sanitaire',
      groupeEcritures: 'Les cotisations et versements',
      nouvelle: 'Nouvelle cotisation ou facture du groupement sanitaire',
      versement: 'Nouveau versement du groupement sanitaire',
      liens: {
        suivi: { titre: 'Traitements', aide: 'Les soins donnés aux animaux et leurs délais d’attente : le même suivi que chez le vétérinaire.' },
        rapports: { titre: 'Rapports d’essais', aide: 'Les résultats d’analyses du laboratoire (brucellose, paratuberculose, Capra’Sana…).' },
        documents: {
          titre: 'Documents du GDS',
          aide: 'Attestation PSE, bons de délivrance, biosécurité (grille d’autodiagnostic), quarantaine.',
        },
        analyses: { titre: 'Analyses du lait', aide: 'Les analyses et le contrôle du lait : les mêmes que la qualité du lait de la laiterie.' },
        avortements: {
          titre: 'Avortements de l’année',
          aide: 'Les femelles qui ont avorté, par année : on les signale depuis leur fiche (onglet Reproduction, « Signaler un avortement »).',
        },
      },
    },
    emballages: {
      titre: 'Emballages',
      groupeTiers: 'Fournisseurs d’emballages',
      ajouterTiers: 'Ajouter un fournisseur d’emballages',
      groupeEcritures: 'Les achats d’emballages',
      nouvelle: 'Nouvelle facture d’emballages',
      liens: {
        stock: { titre: 'Stock d’emballages', aide: 'Les barquettes, sacs et étiquettes qui restent.' },
        conditionnement: {
          titre: 'Conditionnement',
          aide: 'Les emballages consommés à chaque fromage vendu.',
        },
      },
    },
    /** La page du stock de la fromagerie (les cartes de ce qu'on y fabrique et garde) : un titre seulement. */
    fromagerie: { titre: 'Stock de la fromagerie' },
    cheptel: {
      titre: 'Cheptel',
      liens: {
        liste: { titre: 'Tous les animaux', aide: 'La liste du troupeau, avec sa recherche et ses filtres.' },
        lots: { titre: 'Lots d’animaux', aide: 'Les lots : vétérinaire, abattoir, vente…' },
        get male() {
          return { titre: `Nouveau ${V().male.singulier}`, aide: 'Ajouter un mâle au troupeau.' };
        },
        get femelle() {
          return { titre: `Nouvelle ${V().femelle.singulier}`, aide: 'Ajouter une femelle au troupeau.' };
        },
        get petit() {
          return { titre: `Nouveau ${V().petit.singulier}`, aide: 'Déclarer une naissance.' };
        },
        boucles: { titre: 'Boucles', aide: 'L’inventaire des boucles, les repères et les boucles rouges.' },
        carnet: { titre: 'Carnet de naissance', aide: 'Les naissances de l’année et leurs mères.' },
      },
    },
    documents: {
      titre: 'Documents',
      liens: {
        bilan: { titre: 'Bilan annuel', aide: 'Le bilan du cheptel de l’année : entrées, sorties, effectifs.' },
        dossierPac: { titre: 'Dossier PAC', aide: 'Suivi des mouvements, recensement, déclaration d’estive.' },
        circulation: { titre: 'Documents de circulation', aide: 'Ceux des animaux vivants vendus ou achetés.' },
        identification: { titre: 'Documents d’identification', aide: 'Les pièces d’identification de l’exploitation.' },
        historique: { titre: 'Historique du cheptel', aide: 'Les sorties : morts, ventes, abattages.' },
      },
    },
    veterinaire: {
      titre: 'Vétérinaire',
      groupeTiers: 'Vétérinaires',
      ajouterTiers: 'Ajouter un vétérinaire',
      groupeEcritures: 'Les visites et factures du vétérinaire',
      nouvelle: 'Nouvelle visite',
      liens: { traitements: { titre: 'Traitements', aide: 'Les soins donnés aux animaux, avec leurs délais d’attente.' } },
    },
    organismes: {
      titre: 'Organismes',
      groupeTiers: 'Organismes et chambre d’agriculture',
      ajouterTiers: 'Ajouter un organisme',
      groupeEcritures: 'Les aides et subventions',
      nouvelle: 'Nouvelle aide ou subvention',
      liens: {
        dossierPac: { titre: 'Dossier PAC', aide: 'Suivi des mouvements, recensement, déclaration d’estive.' },
        terrains: { titre: 'Terrains', aide: 'Les parcelles et les contrôles de surface.' },
        bilan: { titre: 'Bilan annuel', aide: 'Le bilan du cheptel de l’année : entrées, sorties, effectifs.' },
      },
    },
    entrepot: {
      titre: 'Entrepôt',
      grange: 'Grange',
      oeufs: 'Œufs',
      vide: 'Rien dans ce rayon pour le moment.',
      lait: 'Lait',
      fermer: 'Fermer l’entrepôt',
      stockComplet: 'Tout le stock',
      liens: {
        tout: { titre: 'Tout le stock', aide: 'Les trois onglets : ce qui se vend, ce qui nourrit, le matériel.' },
        aliments: { titre: 'Aliments', aide: 'Le foin, le maïs, les concentrés : ce qu’il reste.' },
        fromages: { titre: 'Fromages', aide: 'Les fromages en stock, par lot.' },
        lait: { titre: 'Lait', aide: 'Le lait produit et le lait vendu.' },
        viande: { titre: 'Viande', aide: 'La viande de l’abattoir à vendre ou à transformer.' },
        boucles: { titre: 'Boucles', aide: 'Les boucles d’identification, avec leur numéro.' },
        emballages: { titre: 'Emballages', aide: 'Les barquettes, sacs et étiquettes.' },
        equipement: { titre: 'Équipement', aide: 'Le matériel, l’entretien, les consommables.' },
        historique: { titre: 'Historique du stock', aide: 'Tous les mouvements, du plus récent au plus ancien.' },
      },
    },
    commercial: {
      titre: 'Commerce',
      groupeTiers: 'Les clients',
      ajouterTiers: 'Ajouter un client',
      groupeEcritures: 'Les ventes aux clients',
      nouvelle: 'Nouvelle vente',
      liens: {
        // Les mêmes titres et aides que le menu de l'onglet Commercial, dont ces lignes ouvrent les pages.
        ventes: { titre: 'Chiffre d’affaires', aide: 'Par produit, par contact et par mois ; paiements en attente.' },
        commandes: { titre: 'Commandes', aide: 'Ce que les contacts ont commandé : à préparer, à livrer, livré.' },
        tarifs: { titre: 'Grille de tarifs', aide: 'Le prix de chaque fromage selon la catégorie de contact, et sa marge.' },
        circuits: { titre: 'Circuits de vente', aide: 'Ce que rapporte chaque circuit : ferme, marché, restaurateurs…' },
        agritourisme: { titre: 'Visites de la ferme', aide: 'Visite, parcours en 4x4, repas et dégustation : les groupes et ce que ça rapporte.' },
      },
    },
    particuliers: {
      titre: 'Particuliers',
      groupeTiers: 'Clients particuliers',
      ajouterTiers: 'Ajouter un particulier',
      groupeEcritures: 'Les ventes aux particuliers',
      nouvelle: 'Nouvelle vente',
      liens: LIENS_DES_CLIENTS,
    },
    surfacesCommerciales: {
      titre: 'Surfaces commerciales',
      groupeTiers: 'Surfaces commerciales',
      ajouterTiers: 'Ajouter une surface commerciale',
      groupeEcritures: 'Les ventes aux surfaces commerciales',
      nouvelle: 'Nouvelle vente',
      liens: LIENS_DES_CLIENTS,
    },
    entreprises: {
      titre: 'Entreprises',
      groupeTiers: 'Entreprises clientes',
      ajouterTiers: 'Ajouter une entreprise',
      groupeEcritures: 'Les ventes aux entreprises',
      nouvelle: 'Nouvelle vente',
      liens: LIENS_DES_CLIENTS,
    },
    visiteurs: {
      titre: 'Visiteurs',
      groupeTiers: 'Visiteurs de la ferme',
      ajouterTiers: 'Ajouter un visiteur',
      groupeEcritures: 'Les ventes aux visiteurs',
      nouvelle: 'Nouvelle vente',
      liens: LIENS_DE_LAGRITOURISME,
    },
    groupesVisiteurs: {
      titre: 'Groupes',
      groupeTiers: 'Groupes de visiteurs',
      ajouterTiers: 'Ajouter un groupe',
      groupeEcritures: 'Les ventes aux groupes',
      nouvelle: 'Nouvelle vente',
      liens: LIENS_DE_LAGRITOURISME,
    },
    tourisme: {
      titre: 'Office de tourisme',
      groupeTiers: 'Offices de tourisme et partenaires',
      ajouterTiers: 'Ajouter un office de tourisme ou un partenaire',
      groupeEcritures: 'Les factures de ces partenaires',
      nouvelle: 'Nouvelle facture',
      liens: {},
    },
    repas: {
      titre: 'Repas',
      groupeTiers: 'Fournisseurs du repas',
      ajouterTiers: 'Ajouter un fournisseur du repas',
      groupeEcritures: 'Les achats du repas',
      nouvelle: 'Nouvelle facture du repas',
      liens: {},
    },
    equarrissage: {
      titre: 'Équarrissage',
      groupeTiers: 'Équarrisseurs',
      ajouterTiers: 'Ajouter un équarrisseur',
      groupeEcritures: 'Les factures d’équarrissage',
      nouvelle: 'Nouvelle facture d’équarrissage',
      liens: {
        bordereaux: { titre: 'Bordereaux de perte', aide: 'Les animaux morts à déclarer, dans le dossier PAC.' },
        historique: { titre: 'Historique du cheptel', aide: 'Les sorties : morts, ventes, abattages.' },
      },
    },
    abattoir: {
      titre: 'Abattoir',
      groupeTiers: 'Abattoirs',
      ajouterTiers: 'Ajouter un abattoir',
      groupeEcritures: 'Les ventes et factures de l’abattoir',
      nouvelle: 'Nouvelle vente de viande',
      liens: {
        amener: {
          titre: 'Nouveau lot d’abattoir',
          aide: 'Les animaux qui partent, leur document de circulation, vivants ou morts : le lot se crée avant la facture.',
        },
        facture: { titre: 'Facture de l’abattoir', aide: 'Émise quelques jours après l’abattage : elle se rattache à un lot.' },
        lots: { titre: 'Lots d’abattoir', aide: 'Les animaux déposés à l’abattoir et leur viande, par jour d’abattage.' },
        afacturer: { titre: 'Lots à facturer', aide: 'La viande récoltée, pas encore facturée à un client.' },
        stock: { titre: 'Stock de viande', aide: 'Ce qui est rentré de l’abattoir et reste à vendre.' },
      },
    },
    boucherie: {
      titre: 'Boucherie / charcuterie',
      groupeTiers: 'Contacts',
      ajouterTiers: 'Ajouter un contact',
      groupeEcritures: 'Les ventes de boucherie et de charcuterie',
      nouvelle: 'Nouvelle vente de charcuterie',
      liens: {
        stock: { titre: 'Stock de viande', aide: 'La viande de l’abattoir, à transformer ou à vendre.' },
        charcuterie: { titre: 'Charcuterie', aide: 'Les produits de charcuterie par lot : fabrication, vente.' },
        fabrication: { titre: 'Fabriquer un produit', aide: 'Transformer la viande du stock en charcuterie.' },
        rappels: { titre: 'Rappels de lots', aide: 'Rappeler des produits déjà vendus.' },
      },
    },
  },
  /** La page de la production de lait. */
  productionLait: {
    nonCalcule: 'Le lait par animal se calcule pour les chèvres et les brebis.',
  },
  /** La fabrication : des fromages numérotés à la suite, qui entrent au stock. */
  fabrication: {
    titre: 'Fabriquer des fromages',
    type: 'Fromage',
    date: 'Date de fabrication',
    quantite: 'Nombre de fromages',
    premier: 'N° du premier lot',
    /** L'explication du « ? » à côté du n° du premier lot : comment le numéro se compose. */
    explicationNumero:
      'Le numéro d’un lot se lit, par exemple, « FF261-1 » :\n\n• F : le produit (F fromage, B boucherie et charcuterie)\n• F : la catégorie (F frais, V vieux, C crottin, B brocciu, F figatellu… : l’initiale du nom pour un autre produit)\n• 26 : l’année de fabrication (2 chiffres)\n• 1 : le jour de l’année (de 1 à 365)\n• -1 : le numéro du fromage de cette fabrication, qui se poursuit à chaque fromage (-2, -3…)\n\nLe numéro est proposé tout seul d’après le produit et la date ; deux fabrications du même produit le même jour se poursuivent.',
    premierAide: 'Chaque fromage a son numéro de lot, à la suite du premier.',
    /** Le bouton qui donne le guide des numéros de lot en PDF. */
    guide: 'Guide des numéros de lot (PDF)',
    dernier: (numero: string) => `Dernier lot : ${numero}`,
    litresParFromage: 'Litres de lait par fromage',
    litresParFromageAide:
      'À indiquer une seule fois : il est gardé dans l’inventaire (crayon du fromage), et le lait utilisé se calcule ensuite d’après le nombre de fromages.',
    litresRequis:
      'Indiquez les litres de lait qu’il faut pour un fromage : ils sont gardés dans l’inventaire.',
    laitUtilise: (nombre: number, par: string, total: string) =>
      `Lait utilisé : ${nombre} × ${par} L = ${total} L`,
    enregistrer: 'Fabriquer',
    quantiteRequise: 'Indiquez le nombre de produits fabriqués.',
    premierRequis: 'Indiquez le n° du premier lot (il se termine par un chiffre).',
    tropDeLots: (max: number) => `Une fabrication ne peut pas dépasser ${max} produits.`,
    dejaPris: (numero: string) => `Le lot ${numero} existe déjà pour ce produit.`,
  },
  /** La fabrication de charcuterie : mêmes champs, sans le lait. */
  fabricationCharcuterie: {
    titre: 'Fabriquer des produits',
    type: 'Produit',
    date: 'Date de fabrication',
    quantite: 'Nombre de produits',
    premier: 'N° du premier lot',
    premierAide: 'Chaque produit a son numéro de lot, à la suite du premier.',
    dernier: (numero: string) => `Dernier lot : ${numero}`,
    enregistrer: 'Fabriquer',
  },
  /** Le rappel : des fromages retirés de la vente. */
  rappel: {
    titre: 'Rappeler des fromages',
    type: 'Fromage',
    date: 'Date du rappel',
    aucun: 'Aucun lot à rappeler : seuls les fromages vendus dont le contrôle n’est pas ok peuvent l’être.',
    choisir: 'Choisissez les lots à rappeler.',
    enregistrer: (nombre: number) => `Rappeler ${nombre} lot${nombre > 1 ? 's' : ''}`,
    aide: 'Seuls les fromages vendus dont le contrôle n’est pas ok sont proposés. Un fromage rappelé est marqué « Rappelé » dans l’inventaire.',
  },
  /** Le rappel de charcuterie. */
  rappelCharcuterie: {
    titre: 'Rappeler des produits',
    type: 'Produit',
    date: 'Date du rappel',
    aucun: 'Aucun lot à rappeler : seuls les produits vendus dont le contrôle n’est pas ok peuvent l’être.',
    choisir: 'Choisissez les lots à rappeler.',
    enregistrer: (nombre: number) => `Rappeler ${nombre} lot${nombre > 1 ? 's' : ''}`,
    aide: 'Seuls les produits vendus dont le contrôle n’est pas ok sont proposés. Un produit rappelé est marqué « Rappelé » dans l’inventaire.',
  },
  /** Les œufs vendus de l'année (les poules). */
  oeufs: {
    titre: 'Œufs vendus',
    aucune: 'Aucune vente d’œufs cette année',
    ajouter: 'Ajouter une vente d’œufs',
    total: (nombre: string, montant: string) => `${nombre} œufs · total : ${montant}`,
  },
  /** La viande vendue de l'année. */
  viande: {
    titre: 'Viande vendue',
    rappeler: 'Rappeler des lots',
    aucune: 'Aucune vente de viande cette année',
    abattoirLe: (date: string) => `Abattoir le ${date}`,
    onglets: {
      aFacturer: (n: number) => (n > 0 ? `À facturer (${n})` : 'À facturer'),
      facturee: (n: number) => (n > 0 ? `Facturée (${n})` : 'Facturée'),
      sansFactureAVendre: (n: number) => (n > 0 ? `À vendre (${n})` : 'À vendre'),
      sansFactureVendue: (n: number) => (n > 0 ? `Vendue (${n})` : 'Vendue'),
    },
    rienASansFacture: 'Aucun animal sans boucle à vendre.',
    avance: 'Avancé',
    sousOnglets: {
      morts: (n: number) => `Morts (${n})`,
      vivants: (n: number) => `Vivants (${n})`,
      disponibles: (n: number) => `Disponibles (${n})`,
      reserves: (n: number) => `Réservés (${n})`,
    },
    vendreSansFacture: 'Vendre sans facture',
    rienAFacturer: 'Aucune viande à facturer.',
    rienAFacturerNote: 'Les viandes à facturer sont disponibles après le départ des animaux à l’abattoir : créez d’abord un lot d’abattoir, avec son document de circulation.',
    rienAVendre: 'Aucune viande à vendre.',
    rienAVendreNote: 'Les viandes à vendre sont disponibles après la déclaration de naissance d’un animal sans boucle.',
    sansFactureAVendre: 'Animaux sans boucle à vendre (sans facture)',
    aFacturer: 'Viande à facturer',
    avecBoucle: 'avec boucle · facture',
    sansBoucleSansFacture: 'sans boucle · sans facture',
    animaux: (nombre: number) => `${nombre} ${nombre > 1 ? 'animaux' : 'animal'}`,
    boucles: (liste: string) => `boucles : ${liste}`,
    animauxVendus: (n: number) => `animaux vendus : ${n}`,
    poids: (kg: string) => `${kg} kg`,
    sansBoucle: 'sans boucle',
    total: (montant: string) => `Total : ${montant}`,
  },
} as const;
