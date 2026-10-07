import { modeEntreprise } from '@/shared/dictionnaire/entreprise';

/** Adresses (routes) de navigation de l'application — à modifier ici uniquement. */

export const ROUTES = {
  INFORMATIONS_EXPLOITATION: '/informations-exploitation',
  BALANCE: '/balance',
  REGLAGES: '/reglages',

  CHEPTEL: '/cheptel',
  CHEPTEL_BILAN: '/cheptel/bilan',
  CHEPTEL_AJOUT_RAPIDE: '/cheptel/ajout-rapide',
  CHEPTEL_NOUVELLE: '/cheptel/nouvelle',
  CHEPTEL_NAISSANCE_NOUVELLE: '/cheptel/naissance-nouvelle',

  CHEPTEL_ALIMENTATION: '/cheptel/alimentation',
  CHEPTEL_VETERINAIRE: '/cheptel/veterinaire',
  CHEPTEL_VISITE_NOUVELLE: '/cheptel/veterinaire/nouvelle',
  CHEPTEL_CONTROLES: '/cheptel/controles',
  CHEPTEL_CONTROLE_NOUVEAU: '/cheptel/controles/nouvelle',

  COMPTABILITE: '/comptabilite',
  COMPTABILITE_NOUVELLE: '/comptabilite/nouvelle',
  /** Les catégories de recette cochées pour chaque espèce (et celles qu'on ajoute). */
  CATEGORIES_RECETTE: '/comptabilite/categories-recette',
  COMPTABILITE_DETAIL: '/comptabilite/detail',
  FISCALITE_IMPOTS: '/comptabilite/fiscalite-impots',
  FISCALITE_RSA: '/comptabilite/fiscalite-rsa',
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
  /** Les comptes du plan comptable, ouverts depuis un écran en cours : `retour` est l'adresse où la flèche de retour ramène. */
  comptesPcgDepuis: (retour: string) =>
    `/comptabilite/comptes-pcg?retour=${encodeURIComponent(retour)}` as const,
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
  jourEcheances: (date: string) => `/clients/echeances/${date}` as const,
  giteJour: (date: string) => `/clients/gite/jour/${date}` as const,
  sejourNouveau: (chambre: number, date: string) =>
    `/clients/gite/sejour/nouveau?chambre=${chambre}&date=${date}` as const,
  /** Un nouveau séjour prérempli d'après un séjour existant (sans son historique de paiement). */
  sejourCopie: (id: string) => `/clients/gite/sejour/nouveau?copie=${id}` as const,
  sejour: (id: string) => `/clients/gite/sejour/${id}` as const,
  ficheComptePcg: (id: string) => `/comptabilite/comptes-pcg/${id}` as const,
} as const;
