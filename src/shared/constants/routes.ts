import { modeEntreprise } from '@/shared/dictionnaire/entreprise';

/** Adresses (routes) de navigation de l'application — à modifier ici uniquement. */

/** Les familles de contrôles qui relèvent de la Production (le reste est dans le Cheptel). */
const FAMILLES_DE_PRODUCTION = ['laitier', 'analyse', 'groupement', 'officiel', 'autocontrole', 'salmonelle'];

/** Le dossier des écrans de contrôle d'une famille : Production pour le lait et les groupements, Cheptel (santé) pour le reste. */
const baseControles = (famille: string): string =>
  FAMILLES_DE_PRODUCTION.includes(famille) ? '/production/controles' : '/sante/controles';

export const ROUTES = {
  INFORMATIONS_EXPLOITATION: '/informations-exploitation',
  RAPPELS_HISTORIQUE: '/rappels-historique',
  REGLAGES: '/reglages',

  /** L'onglet Cheptel : le cheptel (la liste des animaux) et ce qui s'y rapporte. */
  CHEPTEL: '/cheptel',
  /** La liste des animaux vivants. */
  CHEPTEL_LISTE: '/cheptel/liste',
  CHEPTEL_BILAN: '/cheptel/bilan',
  /** Les réglages du cheptel : UGB, primes, effectif déclaré. */
  CHEPTEL_REGLAGES: '/cheptel/reglages',
  CHEPTEL_AJOUT_RAPIDE: '/cheptel/ajout-rapide',
  CHEPTEL_NOUVELLE: '/cheptel/nouvelle',
  CHEPTEL_NAISSANCE_NOUVELLE: '/cheptel/naissance-nouvelle',

  // L'onglet Santé d'un élevage : alimentation, vétérinaire, contrôles
  SANTE_ALIMENTATION: '/sante/alimentation',
  /** La fiche d'une visite vétérinaire (son formulaire, avec ses fichiers) : les visites viennent des dépenses vétérinaires. */
  santeVisite: (id: string) => `/sante/veterinaire/visite?id=${id}` as const,
  /** La liste des contrôles d'une famille (surface, animaux : dans le Cheptel ; laitier, analyses, groupements : dans Production). */
  santeControles: (famille: string) => `${baseControles(famille)}/liste?famille=${famille}` as const,
  /** Un nouveau contrôle, de la famille donnée. */
  santeControleNouveau: (famille: string) => `${baseControles(famille)}/nouvelle?famille=${famille}` as const,
  /** Un groupement : ses contenus. */
  santeGroupement: (id: string) => `/production/controles/groupement?id=${id}` as const,
  /** Un contenu d'un groupement (nouveau sans identifiant, sinon modifié). */
  santeContenuGroupement: (groupementId: string, id?: string) =>
    `/production/controles/contenu?groupementId=${groupementId}${id ? `&id=${id}` : ''}` as const,
  /** Un contrôle (un terrain…) qu'on modifie. */
  santeControleModifier: (famille: string, id: string) =>
    `${baseControles(famille)}/nouvelle?famille=${famille}&id=${id}` as const,

  // L'onglet Production d'un élevage : fromages, viande vendue, contrôle laitier, groupements
  PRODUCTION: '/production',
  /** La page de la production de lait : le lait par animal et par traite. */
  PRODUCTION_LAIT: '/production/lait',
  PRODUCTION_FROMAGES: '/production/fromages',
  PRODUCTION_CHARCUTERIE: '/production/charcuterie',
  /** La fabrication et le rappel d'un produit suivi par lot (`produit` : fromage ou charcuterie). */
  productionFabrication: (produit: string) => `/production/fabrication?produit=${produit}` as const,
  productionRappel: (produit: string) => `/production/rappel?produit=${produit}` as const,
  PRODUCTION_RAPPELS_LOTS: '/production/rappels-lots',
  PRODUCTION_VIANDE: '/production/viande',
  /** Les œufs vendus (les poules). */
  PRODUCTION_OEUFS: '/production/oeufs',
  PRODUCTION_STATISTIQUES: '/production/statistiques',

  /** L'onglet Commercial d'un élevage : ventes et clients, tarifs, commandes et livraisons, circuits de vente. */
  COMMERCIAL: '/commercial',
  COMMERCIAL_VENTES: '/commercial/ventes',
  COMMERCIAL_TARIFS: '/commercial/tarifs',
  COMMERCIAL_COMMANDES: '/commercial/commandes',
  COMMERCIAL_CIRCUITS: '/commercial/circuits',
  /** L'agritourisme : les visites, une visite (nouvelle ou celle dont on donne l'identifiant), les formules. */
  COMMERCIAL_AGRITOURISME: '/commercial/agritourisme',
  COMMERCIAL_VISITE: '/commercial/visite',
  visiteAgritourisme: (id: string) => `/commercial/visite?id=${id}` as const,
  COMMERCIAL_FORMULES: '/commercial/formules',
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
  URSSAF: '/comptabilite/urssaf',
  TVA: '/comptabilite/tva',
  RENTABILITE: '/comptabilite/rentabilite',
  COMPTABILITE_TRESORERIE: '/comptabilite/tresorerie',
  COMPTABILITE_TRESORERIE_REGLAGES: '/comptabilite/tresorerie-reglages',
  FOURNISSEURS: '/comptabilite/fournisseurs',
  FOURNISSEUR_NOUVEAU: '/comptabilite/fournisseurs/nouveau',
  /** Les fournisseurs, ouverts depuis un formulaire en cours : `retour` est l'adresse où la flèche de retour ramène. */
  fournisseursDepuis: (retour: string) =>
    `/comptabilite/fournisseurs?retour=${encodeURIComponent(retour)}` as const,
  // Les clients d'une entreprise ont leur propre onglet ; ceux d'un élevage restent dans le menu de la comptabilité.
  get CLIENTS() {
    return modeEntreprise() ? ('/clients/liste' as const) : ('/comptabilite/clients' as const);
  },
  /** Les clients, ouverts depuis un formulaire en cours : `retour` est l'adresse où la flèche de retour ramène. */
  clientsDepuis: (retour: string): string => `${ROUTES.CLIENTS}?retour=${encodeURIComponent(retour)}`,
  get CLIENT_NOUVEAU() {
    return modeEntreprise() ? ('/clients/nouveau' as const) : ('/comptabilite/clients/nouveau' as const);
  },
  COMPTES_PCG: '/comptabilite/comptes-pcg',
  /** Les comptes du plan comptable, ouverts depuis un écran en cours : `retour` est l'adresse où la flèche de retour ramène ; `categorie` (une catégorie de l'inventaire) limite la liste aux comptes qu'elle autorise. */
  comptesPcgDepuis: (retour: string, categorie?: string) =>
    `/comptabilite/comptes-pcg?retour=${encodeURIComponent(retour)}${categorie ? `&categorie=${encodeURIComponent(categorie)}` : ''}` as const,
  COMPTE_PCG_NOUVEAU: '/comptabilite/comptes-pcg/nouveau',

  ficheChevre: (id: string) => `/cheptel/${id}` as const,
  ficheFacture: (id: string) => `/comptabilite/facture/${id}` as const,
  ficheVente: (id: string) => `/comptabilite/vente/${id}` as const,
  ficheFournisseur: (id: string) => `/comptabilite/fournisseurs/${id}` as const,
  ficheClient: (id: string) =>
    modeEntreprise() ? (`/clients/${id}` as const) : (`/comptabilite/clients/${id}` as const),
  // Explorateur de dossiers d'une entreprise
  CLIENTS_EXPLORATEUR: '/clients',
  STRUCTURE_DOSSIERS: '/structure-dossiers',
  /** Les documents d'identification et d'installation de l'exploitation (Mon établissement), et l'un d'eux (nouveau sans identifiant). */
  DOCUMENTS_IDENTIFICATION: '/documents-identification',
  documentIdentification: (id?: string) =>
    (id ? `/document-identification?id=${id}` : '/document-identification') as string,
  // Les données (écrans ouverts depuis l'onglet Organisation)
  ORGANISATION_ETABLISSEMENT: '/organisation-etablissement',
  ORGANISATION_DONNEES: '/organisation-donnees',
  ORGANISATION_TIERS: '/organisation-tiers',
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
