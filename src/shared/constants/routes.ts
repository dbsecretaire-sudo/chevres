import { modeEntreprise } from '@/shared/dictionnaire/entreprise';

/** Adresses (routes) de navigation de l'application — à modifier ici uniquement. */

export const ROUTES = {
  INFORMATIONS_EXPLOITATION: '/informations-exploitation',
  BALANCE: '/balance',

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
  COMPTE_PCG_NOUVEAU: '/comptabilite/comptes-pcg/nouveau',

  ficheChevre: (id: string) => `/cheptel/${id}` as const,
  ficheFacture: (id: string) => `/comptabilite/facture/${id}` as const,
  ficheVente: (id: string) => `/comptabilite/vente/${id}` as const,
  ficheFournisseur: (id: string) => `/comptabilite/fournisseurs/${id}` as const,
  ficheClient: (id: string) =>
    modeEntreprise() ? (`/clients/${id}` as const) : (`/comptabilite/clients/${id}` as const),
  // Explorateur de dossiers d'une entreprise
  CLIENTS_EXPLORATEUR: '/clients',
  CLIENTS_STRUCTURE: '/clients/structure',
  dossierClient: (id: string) => `/clients/dossiers/${id}` as const,
  sousDossier: (id: string) => `/clients/sous-dossier/${id}` as const,
  elementNouveau: (dossierId: string) => `/clients/element/nouveau?dossierId=${dossierId}` as const,
  element: (id: string) => `/clients/element/${id}` as const,
  // Gestion du gîte (association)
  CLIENTS_DOSSIERS: '/clients/dossiers-clients',
  GITE: '/clients/gite',
  jourEcheances: (date: string) => `/clients/echeances/${date}` as const,
  giteJour: (date: string) => `/clients/gite/jour/${date}` as const,
  sejourNouveau: (chambre: number, date: string) =>
    `/clients/gite/sejour/nouveau?chambre=${chambre}&date=${date}` as const,
  sejour: (id: string) => `/clients/gite/sejour/${id}` as const,
  ficheComptePcg: (id: string) => `/comptabilite/comptes-pcg/${id}` as const,
} as const;
