/** Valeurs et seuils métier du cheptel — à modifier ici uniquement. */

export const SEXE = {
  MALE: 'M',
  FEMELLE: 'F',
} as const;

export const STATUT_CHEVRE = {
  VIVANTE: 'vivante',
  MORTE: 'morte',
  ABATTOIR: 'abattoir',
  VENDUE: 'vendue',
  AUTOCONSOMMEE: 'autoconsommee',
  MORT_NE: 'mortne',
} as const;

export const CATEGORIE_ANIMAL = {
  CHEVRE: 'chevre',
  BOUC: 'bouc',
  CABRIT: 'cabrit',
  VIVANTE: 'vivante',
  TOUT: 'tout',
} as const;

/** En dessous de cet âge (en mois), l'animal est un cabri ; au-delà, une chèvre ou un bouc. */
export const AGE_CABRIT_MAX_MOIS = 6;

/** À partir de cet âge (en mois), un cabri sevré mange comme un adulte et compte dans l'effectif. */
export const AGE_SEVRAGE_MOIS = 2;

/** Dernier mois (1-12) du premier semestre civil. */
export const DERNIER_MOIS_PREMIER_SEMESTRE = 6;

/** Premier mois (1-12) du second semestre civil. */
export const PREMIER_MOIS_SECOND_SEMESTRE = 7;

/** Valeurs du filtre « Statut » de la liste du cheptel (les statuts + deux regroupements). */
export const FILTRE_STATUT_CHEPTEL = {
  VIVANTE: 'vivante',
  MORTE: 'morte',
  ABATTOIR: 'abattoir',
  VENDUE: 'vendue',
  AUTOCONSOMMEE: 'autoconsommee',
  MORT_NE: 'mortne',
  SORTIES: 'sorties',
  TOUT: 'tout',
} as const;

/** Valeurs du filtre « Catégorie » de la liste du cheptel. */
export const FILTRE_CATEGORIE_CHEPTEL = {
  CHEVRE: 'chevre',
  BOUC: 'bouc',
  CABRIT: 'cabrit',
  SANS_BOUCLE: 'sansboucle',
  TOUT: 'tout',
} as const;

/** Critères de tri de la liste du cheptel. */
export const TRI_CHEPTEL = {
  BOUCLE: 'boucle',
  NAISSANCE: 'naissance',
  MISE_BAS: 'misebas',
  ABATTOIR: 'abattoir',
  MORTE: 'morte',
  RENOUVELLEMENT: 'renouvellement',
  ANNEE: 'annee',
} as const;

/** Critères de tri de l'historique (animaux sortis du troupeau). */
export const TRI_HISTORIQUE = {
  SORTIE: 'sortie',
  NAISSANCE: 'naissance',
  BOUCLE: 'boucle',
} as const;

/** Sections repliables de la fiche d'une chèvre. */
export const VUE_FICHE_CHEVRE = {
  VISITES: 'visites',
  CONTROLES: 'controles',
  SUPPRESSION: 'suppression',
} as const;

/** Étapes de l'écran d'ajout rapide. */
export const ETAPE_AJOUT_RAPIDE = {
  ROLE: 'role',
  DETAILS_MERE: 'details-mere',
} as const;

/** Nombre de petits déclarables en une seule mise bas (écran d'ajout rapide). */
export const NB_PETITS_MIN = 1;
export const NB_PETITS_MAX = 6;
