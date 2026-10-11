import { modeEntreprise } from '@/shared/dictionnaire/entreprise';

/** Adresses (routes) de navigation de l'application — à modifier ici uniquement. */

/** Les familles de contrôles qui relèvent de la Production (le reste est dans le Cheptel). */
const FAMILLES_DE_PRODUCTION = ['laitier', 'analyse', 'groupement'];

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
  CHEPTEL_AJOUT_RAPIDE: '/cheptel/ajout-rapide',
  CHEPTEL_NOUVELLE: '/cheptel/nouvelle',
  CHEPTEL_NAISSANCE_NOUVELLE: '/cheptel/naissance-nouvelle',

  // L'onglet Santé d'un élevage : alimentation, vétérinaire, contrôles
  SANTE_ALIMENTATION: '/sante/alimentation',
  SANTE_VETERINAIRE: '/sante/veterinaire',
  SANTE_VISITE_NOUVELLE: '/sante/veterinaire/nouvelle',
  /** La fiche d'une visite vétérinaire (son formulaire, avec ses fichiers). */
  santeVisite: (id: string) => `/sante/veterinaire/nouvelle?id=${id}` as const,
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
  PRODUCTION_FROMAGES: '/production/fromages',
  PRODUCTION_CHARCUTERIE: '/production/charcuterie',
  /** La fabrication et le rappel d'un produit suivi par lot (`produit` : fromage ou charcuterie). */
  productionFabrication: (produit: string) => `/production/fabrication?produit=${produit}` as const,
  productionRappel: (produit: string) => `/production/rappel?produit=${produit}` as const,
  PRODUCTION_RAPPELS_LOTS: '/production/rappels-lots',
  PRODUCTION_VIANDE: '/production/viande',
  PRODUCTION_STATISTIQUES: '/production/statistiques',

  COMPTABILITE: '/comptabilite',
  COMPTABILITE_NOUVELLE: '/comptabilite/nouvelle',
  COMPTABILITE_DETAIL: '/comptabilite/detail',
  FISCALITE: '/comptabilite/fiscalite',
  FISCALITE_IMPOTS: '/comptabilite/fiscalite-impots',
  FISCALITE_RSA: '/comptabilite/fiscalite-rsa',
  URSSAF: '/comptabilite/urssaf',
  TVA: '/comptabilite/tva',
  FOURNISSEURS: '/comptabilite/fournisseurs',
  FOURNISSEUR_NOUVEAU: '/comptabilite/fournisseurs/nouveau',
  // Les clients d'une entreprise ont leur propre onglet ; ceux d'un élevage restent dans le menu de la comptabilité.
  get CLIENTS() {
    return modeEntreprise() ? ('/clients/liste' as const) : ('/comptabilite/clients' as const);
  },
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
  // Les données (écrans ouverts depuis l'onglet Organisation)
  ORGANISATION_ETABLISSEMENT: '/organisation-etablissement',
  ORGANISATION_CHEPTEL: '/organisation-cheptel',
  ORGANISATION_COMPTABILITE: '/organisation-comptabilite',
  ORGANISATION_INVENTAIRE: '/organisation-inventaire',
  ORGANISATION_CONDITIONNEMENT: '/organisation-conditionnement',
  ORGANISATION_DONNEES: '/organisation-donnees',
  ORGANISATION_TIERS: '/organisation-tiers',
  ORGANISATION_CATEGORIES_CLIENT: '/organisation-categories-client',
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
  STOCK_STATISTIQUES: '/stock/stock-statistiques',
  /** La structure des listes de l'inventaire (ajouter des listes aux catégories). */
  STOCK_STRUCTURE: '/stock/structure',
  /**
   * Le stock ouvert depuis un formulaire en cours : `retour` est l'adresse de ce formulaire (le stock affiche alors une
   * flèche pour y revenir), `onglet` l'onglet à ouvrir (les aliments, par exemple) et `espece` l'animal à regarder.
   */
  stockDepuis: (retour: string, onglet?: string, espece?: string) =>
    `/stock?${onglet ? `onglet=${onglet}&` : ''}${espece ? `espece=${espece}&` : ''}retour=${encodeURIComponent(retour)}` as const,
  /** L'historique du stock, ouvert sur un animal (ou sur tous quand `espece` est absent). */
  stockHistorique: (espece?: string) =>
    `/stock/stock-historique${espece ? `?espece=${espece}` : ''}` as const,
  giteJour: (date: string) => `/clients/gite/jour/${date}` as const,
  sejourNouveau: (chambre: number, date: string) =>
    `/clients/gite/sejour/nouveau?chambre=${chambre}&date=${date}` as const,
  /** Un nouveau séjour prérempli d'après un séjour existant (sans son historique de paiement). */
  sejourCopie: (id: string) => `/clients/gite/sejour/nouveau?copie=${id}` as const,
  sejour: (id: string) => `/clients/gite/sejour/${id}` as const,
  ficheComptePcg: (id: string) => `/comptabilite/comptes-pcg/${id}` as const,
} as const;
