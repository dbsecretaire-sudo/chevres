/** Catégories de données enregistrées localement (une entrée par type d'enregistrement). */
export const CATEGORIE_STOCKAGE = {
  CHEPTEL: 'cheptel',
  VENTES: 'ventes',
  FACTURES: 'factures',
  VISITES_VETERINAIRE: 'visites_veterinaire',
  CONTROLES: 'controles',
} as const;

/** Préfixe de toutes les clés AsyncStorage de l'application (le « v1 » est la version du format des données). */
export const PREFIXE_STOCKAGE = 'troupeau:v1:';

/** Séparateur des segments d'une clé de stockage. */
export const SEPARATEUR_CLE = ':';

/** Segment ajouté au préfixe pour les établissements autres que l'établissement historique. */
export const SEGMENT_ETABLISSEMENT = 'e';

/** L'établissement historique garde le préfixe d'origine : les données déjà saisies restent accessibles sans migration. */
export const ID_ETABLISSEMENT_DEFAUT = 'defaut';

/** Noms (suffixes) des clés de stockage. */
export const CLE_STOCKAGE = {
  ETABLISSEMENTS: 'etablissements',
  ETABLISSEMENT_ACTIF: 'etablissement-actif',
  /** Les espèces ajoutées par l'utilisateur et les réglages modifiés des espèces d'office (communs à tous les établissements). */
  ESPECES: 'especes',
  ESPECE_COURANTE: 'espece-courante',
  FOURNISSEURS: 'fournisseurs',
  CLIENTS: 'clients',
  /** Les documents d'identification et d'installation de l'exploitation (pièces scannées). */
  IDENTIFICATION: 'identification',
  DOSSIERS: 'dossiers',
  GITE: 'gite',
  TRADING: 'trading',
  BAR: 'bar',
  /** Les activités annexes du gîte (pizza, charcuterie, guide…) : leurs catégories, leurs articles et leurs tickets. */
  ANNEXES: 'annexes',
  /** L'onglet Commercial : les commandes des clients et les tarifs par catégorie de client. */
  COMMERCIAL: 'commercial',
  STOCK: 'stock',
  COMPTES_PCG: 'comptes-pcg',
  SETTINGS: 'settings',
  DONNEES: 'data',
  ANNEES: 'years',
  INDEX: 'index',
} as const;
