import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';

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

/** Seuils qui dépendent de l'espèce de l'établissement. */
export interface ParametresEspece {
  /** En dessous de cet âge (en mois), l'animal est un petit (cabri, agneau, veau, porcelet) ; au-delà, un adulte. */
  ageMaxPetitMois: number;
  /** À partir de cet âge (en mois), un petit sevré mange comme un adulte et compte dans l'effectif. */
  ageSevrageMois: number;
  /** Nombre maximal de petits déclarables en une seule mise bas. */
  nbPetitsMax: number;
}

export const PARAMETRES_ESPECE: Record<EspeceAnimale, ParametresEspece> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: { ageMaxPetitMois: 6, ageSevrageMois: 2, nbPetitsMax: 6 },
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: { ageMaxPetitMois: 6, ageSevrageMois: 2, nbPetitsMax: 5 },
  // Veau : bovin de moins de 8 mois (définition européenne).
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: { ageMaxPetitMois: 8, ageSevrageMois: 3, nbPetitsMax: 2 },
  // Porcelet : jusqu'à la fin du post-sevrage (environ 10 semaines) ; sevrage vers 4 semaines.
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: { ageMaxPetitMois: 3, ageSevrageMois: 1, nbPetitsMax: 20 },
  // Poussin : jusqu'à environ 2 mois ; une couvée compte jusqu'à une quinzaine d'œufs.
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: { ageMaxPetitMois: 2, ageSevrageMois: 1, nbPetitsMax: 15 },
};

/** Seuils de l'espèce courante. */
export const parametresEspece = (): ParametresEspece => PARAMETRES_ESPECE[especeCourante()];

export const ageMaxPetitMois = (): number => parametresEspece().ageMaxPetitMois;
export const ageSevrageMois = (): number => parametresEspece().ageSevrageMois;
export const nbPetitsMax = (): number => parametresEspece().nbPetitsMax;

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

/** Nombre minimal de petits déclarables en une seule mise bas (le maximum dépend de l'espèce : voir nbPetitsMax). */
export const NB_PETITS_MIN = 1;
