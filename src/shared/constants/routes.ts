/** Adresses (routes) de navigation de l'application — à modifier ici uniquement. */

export const ROUTES = {
  INFORMATIONS_EXPLOITATION: '/informations-exploitation',

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
  FOURNISSEURS: '/comptabilite/fournisseurs',
  FOURNISSEUR_NOUVEAU: '/comptabilite/fournisseurs/nouveau',
  CLIENTS: '/comptabilite/clients',
  CLIENT_NOUVEAU: '/comptabilite/clients/nouveau',
  COMPTES_PCG: '/comptabilite/comptes-pcg',
  COMPTE_PCG_NOUVEAU: '/comptabilite/comptes-pcg/nouveau',

  ficheChevre: (id: string) => `/cheptel/${id}` as const,
  ficheFacture: (id: string) => `/comptabilite/facture/${id}` as const,
  ficheVente: (id: string) => `/comptabilite/vente/${id}` as const,
  ficheFournisseur: (id: string) => `/comptabilite/fournisseurs/${id}` as const,
  ficheClient: (id: string) => `/comptabilite/clients/${id}` as const,
  ficheComptePcg: (id: string) => `/comptabilite/comptes-pcg/${id}` as const,
} as const;
