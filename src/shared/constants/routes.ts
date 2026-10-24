
/** Adresses (routes) de navigation de l'application — à modifier ici uniquement. */

/** Les familles de contrôles qui relèvent de la Production (le reste est dans le Cheptel). */
const FAMILLES_DE_PRODUCTION = ['laitier', 'analyse', 'officiel', 'autocontrole', 'salmonelle'];

/** Le dossier des écrans des partenaires (les groupements, organismes, assureurs, équarrisseurs) : dans l'onglet Commercial. */
const DOSSIER_PARTENAIRES = '/commercial/partenaires';

/** Le dossier des écrans de contrôle d'une famille : Commercial pour les partenaires, Production pour le lait, Cheptel (santé) pour le reste. */
const baseControles = (famille: string): string =>
  famille === 'groupement'
    ? DOSSIER_PARTENAIRES
    : FAMILLES_DE_PRODUCTION.includes(famille)
      ? '/production/controles'
      : '/sante/controles';

export const ROUTES = {
  INFORMATIONS_EXPLOITATION: '/informations-exploitation',
  /** L'accueil de la ferme (l'exploitation et le travail du produit), d'où qu'on vienne : le paramètre change à chaque appel, pour que l'accueil quitte l'intérieur où il était. */
  accueilFerme: () => `/?accueil=${Date.now()}` as const,
  /** L'accueil tel qu'on l'a quitté (dans l'intérieur donné, ou sur la carte) : là où la flèche de retour ramène après un bouton. */
  retourAccueil: (interieur?: string) => `/?accueil=retour&interieur=${interieur ?? ''}` as const,
  RAPPELS_HISTORIQUE: '/rappels-historique',
  /** Le didacticiel : toutes les options de l'application, expliquées (activable sur l'accueil). */
  DIDACTICIEL: '/didacticiel',
  REGLAGES: '/reglages',

  /** L'onglet Cheptel : le cheptel (la liste des animaux) et ce qui s'y rapporte. */
  CHEPTEL: '/cheptel',
  /** La liste des animaux vivants. */
  /** La liste des animaux : la page « Tous les animaux » (l'ancienne liste « Cheptel actif » n'existe plus). */
  CHEPTEL_LISTE: '/production/lieu?lieu=animaux',
  /** La page de menu du cheptel : les pages où l'on entre (animaux, naissances, sorties, lots, traitements, boucles, contrôles). */
  CHEPTEL_MENU: '/cheptel/menu',
  /** Ce que le berger a saisi sur le terrain (naissances, morts) et qui reste à compléter. */
  CHEPTEL_A_COMPLETER: '/cheptel/a-completer',
  CHEPTEL_BILAN: '/cheptel/bilan',
  /** Le tableau de bord du cheptel : la pyramide des âges et les mouvements de l'année. */
  CHEPTEL_TABLEAU_DE_BORD: '/cheptel/tableau-de-bord',
  /** Les naissances (les mises bas, portée par portée) et les sorties (mortes, vendues, abattoir). */
  CHEPTEL_NAISSANCES: '/cheptel/naissances',
  CHEPTEL_HISTORIQUE: '/cheptel/historique',
  /** Le dossier PAC : suivi des mouvements, bordereaux de perte, recensement, déclaration d'estive. */
  CHEPTEL_DOSSIER_PAC: '/cheptel/dossier-pac',
  /** La bibliothèque des documents générés ; `bibliothequeDepuis` l'ouvre depuis un écran (la flèche de retour y revient). */
  CHEPTEL_BIBLIOTHEQUE: '/cheptel/bibliotheque',
  /** Les documents de circulation à déposer (ventes et dépenses d'animaux vivants) ; `documentsCirculationDepuis` l'ouvre, avec éventuellement l'écriture à mettre en évidence. */
  CHEPTEL_DOCUMENTS_CIRCULATION: '/cheptel/documents-circulation',
  documentsCirculationDepuis: (retour: string, ecriture?: string) =>
    `/cheptel/documents-circulation?retour=${encodeURIComponent(retour)}${ecriture ? `&ecriture=${encodeURIComponent(ecriture)}` : ''}` as const,
  bibliothequeDepuis: (retour: string) => `/cheptel/bibliotheque?retour=${encodeURIComponent(retour)}` as const,
  /** Les traitements donnés aux animaux et leurs délais d'attente. */
  CHEPTEL_TRAITEMENTS: '/cheptel/traitements',
  CHEPTEL_TRAITEMENT_NOUVEAU: '/cheptel/traitement',
  /** Un nouveau traitement pour un lot d'animaux (ses boucles sont déjà reprises). */
  traitementPourLot: (lotId: string) => `/cheptel/traitement?lotId=${lotId}` as const,
  /** Un nouveau traitement pour une visite vétérinaire (`visite` : la facture du vétérinaire) : il s'y rattache. */
  traitementPourVisite: (visite: string) => `/cheptel/traitement?visite=${visite}` as const,
  /** Les lots d'animaux et le suivi sanitaire de chacun. */
  CHEPTEL_LOTS: '/cheptel/lots',
  CHEPTEL_LOT_NOUVEAU: '/cheptel/lot',
  /** La gestion des catégories de lots : renommer, ajouter, supprimer, ranger. */
  CHEPTEL_LOTS_CATEGORIES: '/cheptel/lots-categories',
  /** Les lots d'une catégorie (`autres` : ceux sans catégorie), dans leur propre page. */
  lotsDeLaCategorie: (categorie: string) => `/cheptel/lots-categorie?categorie=${encodeURIComponent(categorie)}` as const,
  /** Un nouveau lot, dans la catégorie donnée. */
  lotNouveau: (categorie: string) => `/cheptel/lot?categorie=${encodeURIComponent(categorie)}` as const,
  lot: (id: string) => `/cheptel/lot?id=${id}` as const,
  /** L'assistant « Nouveau lot d'abattoir » : le départ d'animaux (le choix des animaux, le document de circulation, vivants ou morts), avant toute écriture. */
  lotAbattoirNouveau: (destination?: 'vivants') =>
    `/production/lot-abattoir${destination ? `?destination=${destination}` : ''}` as const,
  /** Les documents du groupement sanitaire (GDS) déposés par l'éleveur. */
  DOCUMENTS_GDS: '/production/documents-gds',
  /** La flotte : la liste des véhicules de l'exploitation (depuis le Garage). */
  FLOTTE: '/production/flotte',
  /** Un véhicule de la flotte (sans identifiant : un nouveau), ouvert sur un onglet (informations, assurance, reparations). */
  vehicule: (id?: string, onglet?: string) =>
    `/production/vehicule${id || onglet ? '?' : ''}${[id ? `id=${id}` : '', onglet ? `onglet=${onglet}` : ''].filter(Boolean).join('&')}` as const,
  /** Les rapports d'essais du laboratoire (prophylaxie) déposés par l'éleveur. */
  RAPPORTS_ESSAIS_GDS: '/production/rapports-essais',
  /** La fiche d'une vente d'animaux vivants : l'acheteur, les animaux, le document de circulation, la facture. */
  venteVivants: (id: string) => `/production/depart?id=${id}` as const,
  /** « Ajouter du lait » : le lait du jour, sans date (celle d'aujourd'hui), seulement les litres. */
  LAIT_DU_JOUR: '/production/lait-du-jour',
  /** L'écran « terrain » d'une zone de l'accueil (le troupeau, l'atelier, l'accueil du public) : de très grands boutons, une action chacun. */
  terrain: (zone: string) => `/production/terrain?zone=${zone}` as const,
  /** Les ventes d'animaux vivants : la liste d'abord, puis « Nouvelle vente ». */
  VENTES_VIVANTS: '/production/ventes-vivants',
  /** Le cadre réglementaire de l'atelier (fabriquer et vendre fromages, viande, charcuterie ; la Corse). */
  CADRE_REGLEMENTAIRE_ATELIER: '/production/cadre-reglementaire',
  /** Les enlèvements d'équarrissage (Équarrissage › Enlèvements). */
  ENLEVEMENTS: '/production/enlevements',
  /** La fiche d'un enlèvement d'équarrissage (sans identifiant : un nouveau). */
  enlevement: (id?: string) => `/production/enlevement${id ? `?id=${id}` : ''}` as const,
  /** Le rapport d'essais d'une visite vétérinaire (`visite` : la facture du vétérinaire) : ses documents téléversés. */
  rapportEssais: (visite: string) => `/production/rapport-essais?visite=${visite}` as const,
  /** Un lot ouvert depuis la Production (viande) : le même écran, mais l'onglet du bas reste Production au lieu de passer à Cheptel. */
  lotDeProduction: (id: string) => `/production/lot?id=${id}` as const,
  /** Le lot ouvert depuis la Comptabilité (une vente, une dépense) : il reste dans la Comptabilité. */
  lotDeComptabilite: (id: string) => `/comptabilite/lot?id=${id}` as const,
  traitement: (id: string) => `/cheptel/traitement?id=${id}` as const,
  /** Les réglages du cheptel : UGB, primes, effectif déclaré. */
  CHEPTEL_REGLAGES: '/cheptel/reglages',
  CHEPTEL_AJOUT_RAPIDE: '/cheptel/ajout-rapide',
  CHEPTEL_NOUVELLE: '/cheptel/nouvelle',
  CHEPTEL_NAISSANCE_NOUVELLE: '/cheptel/naissance-nouvelle',

  // L'onglet Santé d'un élevage : alimentation, vétérinaire, contrôles
  SANTE_ALIMENTATION: '/sante/alimentation',
  /** La fiche d'une visite vétérinaire (son formulaire, avec ses fichiers) : les visites viennent des dépenses vétérinaires. */
  santeVisite: (id: string) => `/sante/veterinaire/visite?id=${id}` as const,
  /** La liste des contrôles d'une famille (surface, animaux : dans le Cheptel ; laitier, analyses : dans Production ; partenaires : dans Commercial). */
  santeControles: (famille: string) => `${baseControles(famille)}/liste?famille=${famille}` as const,
  /** La liste des contrôles d'une famille, ouverte sur l'un de ses onglets (la santé, les boucles, les contrôles des animaux). */
  santeControlesOnglet: (famille: string, onglet: string) =>
    `${baseControles(famille)}/liste?famille=${famille}&onglet=${onglet}` as const,
  /** Un nouveau contrôle, de la famille donnée. */
  santeControleNouveau: (famille: string) => `${baseControles(famille)}/nouvelle?famille=${famille}` as const,
  /** Un document d'un contact (courrier, contrat, aide…), ouvert depuis sa fiche : il reste dans la section Contacts (nouveau sans identifiant, sinon modifié). */
  contactContenu: (groupementId: string, id?: string) =>
    `/comptabilite/contacts/contenu?groupementId=${groupementId}${id ? `&id=${id}` : ''}` as const,
  /** Un contrat d'assurance (nouveau sans identifiant, sinon modifié) : de l'assureur donné, et du véhicule quand on le souscrit depuis sa fiche. */
  contratAssureur: (options: { fournisseur?: string; id?: string; vehicule?: string } = {}) => {
    const parametres = Object.entries(options)
      .filter(([, valeur]) => !!valeur)
      .map(([cle, valeur]) => `${cle}=${encodeURIComponent(valeur as string)}`)
      .join('&');
    return `/comptabilite/contacts/contrat${parametres ? `?${parametres}` : ''}` as const;
  },
  /** Un dossier d'un contact (un organisme, une association) : ses dossiers et ses contenus. */
  contactDossier: (contactId: string, dossierId: string) =>
    `/comptabilite/contacts/dossier?contact=${contactId}&dossier=${dossierId}` as const,
  /** Un groupement : ses contenus. */
  santeGroupement: (id: string) => `${DOSSIER_PARTENAIRES}/groupement?id=${id}` as const,
  /** Un contenu d'un groupement (nouveau sans identifiant, sinon modifié). */
  santeContenuGroupement: (groupementId: string, id?: string) =>
    `${DOSSIER_PARTENAIRES}/contenu?groupementId=${groupementId}${id ? `&id=${id}` : ''}` as const,
  /** Un contrôle (un terrain…) qu'on modifie. */
  santeControleModifier: (famille: string, id: string) =>
    `${baseControles(famille)}/nouvelle?famille=${famille}&id=${id}` as const,

  // L'onglet Production d'un élevage : fromages, viande vendue, contrôle laitier, groupements
  PRODUCTION: '/production',
  /** La liste des écritures, réduite à celles données (leurs identifiants) et rangées par tiers : « 24 autres écritures » d'un lieu de la ferme. */
  comptabiliteDuLieu: (ids: readonly string[], titre: string) =>
    `/comptabilite/liste?ecritures=${[...new Set(ids)].join(';')}&titre=${encodeURIComponent(titre)}` as const,
  /** La page d'un lieu de la carte de la ferme qui a un tiers (pompe, vétérinaire, foin et maïs, organismes, équarrissage, abattoir, boucherie). */
  lieu: (cle: string) => `/production/lieu?lieu=${cle}` as const,
  /** La laiterie : le lait, sa qualité, le récolteur (contacts et factures). */
  PRODUCTION_LAITERIE: '/production/laiterie',
  /** La page de la production de lait : le lait par animal et par traite. */
  PRODUCTION_LAIT: '/production/lait',
  PRODUCTION_FROMAGES: '/production/fromages',
  PRODUCTION_CHARCUTERIE: '/production/charcuterie',
  /** Les plats préparés : leur stock et leurs lots. */
  PRODUCTION_PLATS: '/production/plats',
  /** Les savons au lait de chèvre : leur stock et leurs lots. */
  PRODUCTION_SAVONS: '/production/savons',
  /** Le dossier réglementaire d'un savon (DIP, rapport de sécurité, notification CPNP…). */
  productionSavonDossier: (article: string) => `/production/savon-dossier?article=${encodeURIComponent(article)}` as const,
  /** Les lots de l'atelier : fromages, viande, boucherie / charcuterie, plats préparés. */
  PRODUCTION_LOTS: '/production/lots',
  /** Les analyses d'un produit fini (`produit` : fromage, charcuterie, plat ou savon), et une analyse (nouvelle sans identifiant, sinon modifiée). */
  analysesProduit: (produit: string) => `/production/analyses-produit?produit=${produit}` as const,
  analyseProduit: (produit: string, id?: string, fabrication?: string) =>
    `/production/analyse-produit?produit=${produit}${id ? `&id=${id}` : ''}${fabrication ? `&fabrication=${encodeURIComponent(fabrication)}` : ''}` as const,
  /** La bibliothèque de recettes de l'atelier (fromages, charcuterie, plats préparés, savons). */
  PRODUCTION_RECETTES: '/production/recettes',
  /** Ajouter une recette (avec le produit à préchoisir) ou modifier celle dont on donne l'identifiant. */
  productionRecette: (id?: string, produit?: string) =>
    `/production/recette${id || produit ? `?${[id ? `id=${id}` : '', produit ? `produit=${produit}` : ''].filter(Boolean).join('&')}` : ''}` as const,
  /** Le registre des analyses de l'atelier : les fabrications (fromages, charcuterie, plats, savons) et leurs analyses. */
  PRODUCTION_REGISTRE_ANALYSES: '/production/registre-analyses',
  /** La fabrication et le rappel d'un produit suivi par lot (`produit` : fromage ou charcuterie). */
  productionFabrication: (produit: string) => `/production/fabrication?produit=${produit}` as const,
  /** Fabriquer un fromage ou de la charcuterie en très grands boutons (le produit, les litres de lait, combien). */
  /** Imprimer des étiquettes en très grands boutons (le produit, sa fabrication, combien). */
  PRODUCTION_ETIQUETTES_SIMPLE: '/production/etiquettes-simple',
  /** Les ventes, en tuiles : on choisit le produit vendu (dont la viande à vendre et la viande à facturer). */
  PRODUCTION_VENTES_SIMPLE: '/production/ventes-simple',
  /** Le cadre réglementaire de la fromagerie en tuiles : une démarche par tuile, ouverte en pleine page. */
  PRODUCTION_CADRE_SIMPLE: '/production/cadre-simple',
  /** Les lots de viande du mode normal, sans onglets : `afacturer` (à facturer et facturée) ou `avendre` (à vendre et vendue). */
  productionLotsViandeSimple: (quoi: 'afacturer' | 'avendre') => `/production/lots-viande-simple?quoi=${quoi}` as const,
  productionFabricationSimple: (produit: string) => `/production/fabrication-simple?produit=${produit}` as const,
  productionRappel: (produit: string) => `/production/rappel?produit=${produit}` as const,
  PRODUCTION_RAPPELS_LOTS: '/production/rappels-lots',
  PRODUCTION_VIANDE: '/production/viande',
  /** Les œufs vendus (les poules). */
  PRODUCTION_OEUFS: '/production/oeufs',
  PRODUCTION_STATISTIQUES: '/production/statistiques',

  /** L'onglet Commercial d'un élevage : ventes et clients, tarifs, commandes et livraisons, circuits de vente. */
  COMMERCIAL: '/commercial',
  COMMERCIAL_VENTES: '/commercial/ventes',
  /** Les ventes ouvertes sur une vue : « encaisser » (les paiements en attente) ou « relancer » (les clients à relancer). */
  commercialVentes: (vue: 'encaisser' | 'relancer') => `/commercial/ventes?vue=${vue}` as const,
  COMMERCIAL_TARIFS: '/commercial/tarifs',
  COMMERCIAL_COMMANDES: '/commercial/commandes',
  COMMERCIAL_CIRCUITS: '/commercial/circuits',
  /** Les pages simples de l'accueil du public (tuiles) : nouvelle visite, visites, formules, obligations. */
  COMMERCIAL_VISITE_SIMPLE: '/commercial/visite-simple',
  COMMERCIAL_VISITES_SIMPLE: '/commercial/visites-simple',
  COMMERCIAL_FORMULES_SIMPLE: '/commercial/formules-simple',
  COMMERCIAL_ACCUEIL_PUBLIC_SIMPLE: '/commercial/accueil-public-simple',
  /** L'agritourisme : les visites, une visite (nouvelle ou celle dont on donne l'identifiant), les formules. */
  COMMERCIAL_AGRITOURISME: '/commercial/agritourisme',
  COMMERCIAL_VISITE: '/commercial/visite',
  visiteAgritourisme: (id: string) => `/commercial/visite?id=${id}` as const,
  COMMERCIAL_FORMULES: '/commercial/formules',
  /** Les démarches pour accueillir du public à la ferme. */
  COMMERCIAL_ACCUEIL_PUBLIC: '/commercial/accueil-public',
  COMMERCIAL_FORMULE: '/commercial/formule',
  formuleAgritourisme: (id: string) => `/commercial/formule?id=${id}` as const,
  /** Une nouvelle commande, ou celle dont on donne l'identifiant. */
  COMMERCIAL_COMMANDE: '/commercial/commande',
  commande: (id: string) => `/commercial/commande?id=${id}` as const,

  COMPTABILITE: '/comptabilite',
  /** La liste des écritures (la page d'accueil de la comptabilité est le menu `COMPTABILITE`). */
  COMPTABILITE_LISTE: '/comptabilite/liste',
  /** Le conditionnement des fromages : les emballages consommés à chaque vente (réglage de l'inventaire). */
  COMPTABILITE_CONDITIONNEMENT: '/comptabilite/conditionnement',
  /** L'inventaire : le menu des stocks et du conditionnement des fromages (dans la comptabilité). */
  COMPTABILITE_INVENTAIRE: '/comptabilite/inventaire',
  /** Les stocks (la liste de l'inventaire) ; `stockDepuis` les ouvre depuis un formulaire en cours. */
  COMPTABILITE_STOCKS: '/comptabilite/stocks',
  /** Les réglages de la comptabilité : plan comptable, mode simple ou avancé, rappels de déclaration. */
  COMPTABILITE_REGLAGES: '/comptabilite/reglages',
  COMPTABILITE_TAUX: '/comptabilite/taux',
  COMPTABILITE_NOUVELLE: '/comptabilite/nouvelle',
  COMPTABILITE_DETAIL: '/comptabilite/detail',
  FISCALITE: '/comptabilite/fiscalite',
  FISCALITE_IMPOTS: '/comptabilite/fiscalite-impots',
  FISCALITE_RSA: '/comptabilite/fiscalite-rsa',
  TVA: '/comptabilite/tva',
  RENTABILITE: '/comptabilite/rentabilite',
  COMPTABILITE_TRESORERIE: '/comptabilite/tresorerie',
  COMPTABILITE_TRESORERIE_REGLAGES: '/comptabilite/tresorerie-reglages',
  /** Les contacts : clients et fournisseurs en une seule liste. */
  CONTACTS: '/comptabilite/contacts',
  CONTACT_NOUVEAU: '/comptabilite/contacts/nouveau',
  ficheContact: (id: string) => `/comptabilite/contacts/${id}` as const,
  FOURNISSEURS: '/comptabilite/fournisseurs',
  FOURNISSEUR_NOUVEAU: '/comptabilite/fournisseurs/nouveau',
  /** Les fournisseurs, ouverts depuis un formulaire en cours : `retour` est l'adresse où la flèche de retour ramène. */
  fournisseursDepuis: (retour: string) =>
    `/comptabilite/fournisseurs?retour=${encodeURIComponent(retour)}` as const,
  CLIENTS: '/comptabilite/clients',
  /** Les clients, ouverts depuis un formulaire en cours : `retour` est l'adresse où la flèche de retour ramène. */
  clientsDepuis: (retour: string): string => `${ROUTES.CLIENTS}?retour=${encodeURIComponent(retour)}`,
  CLIENT_NOUVEAU: '/comptabilite/clients/nouveau',
  COMPTES_PCG: '/comptabilite/comptes-pcg',
  /** Le plan comptable général en consultation : tous les comptes et de quoi choisir en cas de doute. */
  PLAN_COMPTABLE: '/comptabilite/plan-comptable',
  /** Les comptes du plan comptable, ouverts depuis un écran en cours : `retour` est l'adresse où la flèche de retour ramène ; `categorie` (une catégorie de l'inventaire) limite la liste aux comptes qu'elle autorise. */
  comptesPcgDepuis: (retour: string, categorie?: string) =>
    `/comptabilite/comptes-pcg?retour=${encodeURIComponent(retour)}${categorie ? `&categorie=${encodeURIComponent(categorie)}` : ''}` as const,
  COMPTE_PCG_NOUVEAU: '/comptabilite/comptes-pcg/nouveau',

  ficheChevre: (id: string) => `/cheptel/${id}` as const,
  /** La fiche d'un animal ouverte depuis une liste (les naissances, l'historique, la viande…) : la flèche de retour y ramène. */
  ficheChevreDepuis: (id: string, retour: string) => `/cheptel/${id}?retour=${encodeURIComponent(retour)}` as const,
  ficheFacture: (id: string) => `/comptabilite/facture/${id}` as const,
  /** La fiche d'une facture ouverte d'un écran précis : sa flèche de retour y ramène. */
  ficheFactureDepuis: (id: string, retour: string) => `/comptabilite/facture/${id}?retour=${encodeURIComponent(retour)}` as const,
  ficheVente: (id: string) => `/comptabilite/vente/${id}` as const,
  /** La fiche d'une vente ouverte d'un écran précis : sa flèche de retour y ramène (Production › Viande, par exemple). */
  ficheVenteDepuis: (id: string, retour: string) => `/comptabilite/vente/${id}?retour=${encodeURIComponent(retour)}` as const,
  ficheFournisseur: (id: string) => `/comptabilite/fournisseurs/${id}` as const,
  ficheClient: (id: string) => `/comptabilite/clients/${id}` as const,
  /** Les documents d'identification et d'installation de l'exploitation (Mon établissement), et l'un d'eux (nouveau sans identifiant). */
  DOCUMENTS_IDENTIFICATION: '/documents-identification',
  documentIdentification: (id?: string) =>
    (id ? `/document-identification?id=${id}` : '/document-identification') as string,
  // Les données (écrans ouverts depuis l'onglet Organisation)
  ORGANISATION_ETABLISSEMENT: '/organisation-etablissement',
  ORGANISATION_DONNEES: '/organisation-donnees',
  ORGANISATION_REGLES: '/organisation-regles',
  ORGANISATION_TIERS: '/organisation-tiers',
  ORGANISATION_LISTES: '/organisation-listes',
  ORGANISATION_CATEGORIES_CLIENT: '/organisation-categories-client',
  ORGANISATION_CATEGORIES_TIERS: '/organisation-categories-tiers',
  EXPORT_DONNEES: '/export-donnees',
  PDF_DONNEES: '/pdf-donnees',
  SAUVEGARDE_LOCALE: '/sauvegarde-locale',
  GOOGLE_DRIVE: '/google-drive',
  dossierClient: (id: string) => `/clients/dossiers/${id}` as const,
  sousDossier: (id: string) => `/clients/sous-dossier/${id}` as const,
  elementNouveau: (dossierId: string) => `/clients/element/nouveau?dossierId=${dossierId}` as const,
  element: (id: string) => `/clients/element/${id}` as const,
  // Journal de trading (activité financière)
  JOURNAL_TRADING: '/clients/journal',
  tradeNouveau: '/clients/trade/nouveau',
  trade: (id: string) => `/clients/trade/${id}` as const,
  // Gestion du gîte (association)
  CLIENTS_DOSSIERS: '/clients/dossiers-clients',
  GITE: '/clients/gite',
  /** L'historique des réservations du gîte (année active), ouvert sur une réservation quand `sejour` est donné. */
  giteHistorique: (sejour?: string) =>
    `/clients/gite/historique${sejour ? `?sejour=${sejour}` : ''}` as const,
  /** L'écran d'une activité annexe du gîte. */
  annexe: (id: string) => `/clients/annexe/${id}` as const,
  /** Les tickets d'un jour d'une activité qui a le calendrier des repas (le restaurant). */
  annexeJour: (id: string, jour: string) => `/clients/annexe/${id}?jour=${jour}` as const,
  STOCK_STATISTIQUES: '/comptabilite/stock-statistiques',
  /** La structure des listes de l'inventaire (ajouter des listes aux catégories). */
  STOCK_STRUCTURE: '/comptabilite/stock-structure',
  /**
   * Le stock ouvert depuis un formulaire en cours : `retour` est l'adresse de ce formulaire (le stock affiche alors une
   * flèche pour y revenir), `onglet` l'onglet à ouvrir (les aliments, par exemple) et `espece` l'animal à regarder.
   */
  stockDepuis: (retour: string, onglet?: string, espece?: string) =>
    `/comptabilite/stocks?${onglet ? `onglet=${onglet}&` : ''}${espece ? `espece=${espece}&` : ''}retour=${encodeURIComponent(retour)}` as const,
  /** L'historique du stock, ouvert sur un animal (ou sur tous quand `espece` est absent). */
  stockHistorique: (espece?: string) =>
    `/comptabilite/stock-historique${espece ? `?espece=${espece}` : ''}` as const,
  giteJour: (date: string) => `/clients/gite/jour/${date}` as const,
  sejourNouveau: (chambre: number, date: string) =>
    `/clients/gite/sejour/nouveau?chambre=${chambre}&date=${date}` as const,
  /** Un nouveau séjour prérempli d'après un séjour existant (sans son historique de paiement). */
  sejourCopie: (id: string) => `/clients/gite/sejour/nouveau?copie=${id}` as const,
  sejour: (id: string) => `/clients/gite/sejour/${id}` as const,
  /** La fiche d'un compte ; `espece` : l'espèce que la liste filtrait (retirer le compte ne vaut alors que pour elle). */
  ficheComptePcg: (id: string, espece?: string) =>
    `/comptabilite/comptes-pcg/${id}${espece ? `?espece=${espece}` : ''}` as const,
} as const;
