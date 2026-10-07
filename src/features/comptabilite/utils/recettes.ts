import type { ActiviteComptable, CategorieRecette, CategorieVente } from '@/features/comptabilite/types';
import {
  CATEGORIES_RECETTE_COMMUNES,
  CATEGORIES_RECETTE_PAR_ESPECE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  GROUPES_RECETTE_ASSOCIATION,
  GROUPES_RECETTE_COMMUNS,
  GROUPES_RECETTE_FINANCE,
  GROUPES_RECETTE_PAR_ESPECE,
  GROUPES_RECETTE_SERVICES,
  ESPECES_LAITIERES,
  TOUS_GROUPES_RECETTE_ANIMAUX,
  type GROUPE_RECETTE,
  type GroupeRecetteDefinition,
} from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { choixGroupesRecette } from '@/features/comptabilite/utils/choixGroupesRecette';
import { ACTIVITE_COMMUNE, ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import {
  ESPECE_PAR_DEFAUT,
  de,
  especeCourante,
  especesActives,
  petitsDe,
} from '@/shared/dictionnaire/animaux';
import { LABEL_CATEGORIE_RECETTE } from '@/shared/textes/libelles';

/**
 * Les groupes de recettes d'une entreprise selon ses types : prestations et ventes pour un secrétariat, hébergement,
 * restauration, bar, cotisations et dons pour un gîte, gains de trading et dépôts pour une activité financière (les
 * listes se complètent si l'établissement a plusieurs types).
 */
export function groupesRecetteEntreprise(): GroupeRecetteDefinition[] {
  const activites = activitesEtablissement();
  const association = activites.includes(ACTIVITE_SOCIETE.ASSOCIATION);
  const services = activites.includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE);
  const finance = activites.includes(ACTIVITE_SOCIETE.LIBERAL);
  const listes = [
    ...(services || (!association && !finance) ? GROUPES_RECETTE_SERVICES : []),
    ...(association ? GROUPES_RECETTE_ASSOCIATION : []),
    ...(finance ? GROUPES_RECETTE_FINANCE : []),
  ];
  // Un même groupe (vente de marchandises, aide, autre) ne figure qu'une fois.
  return listes.filter((g, i) => listes.findIndex((autre) => autre.groupe === g.groupe) === i);
}

/** Les groupes d'une écriture « commune » : ceux de l'entreprise, ou seulement aide et autre pour un élevage. */
const groupesCommuns = (): GroupeRecetteDefinition[] =>
  modeEntreprise() ? groupesRecetteEntreprise() : GROUPES_RECETTE_COMMUNS;

/** Catégories de recette proposées pour une activité : celles de son espèce, ou seulement aide et autre si « commun ». */
export const categoriesRecetteActivite = (activite: ActiviteComptable): readonly CategorieRecette[] =>
  activite === ACTIVITE_COMMUNE
    ? modeEntreprise()
      ? groupesRecetteEntreprise().flatMap((g) => g.categories)
      : CATEGORIES_RECETTE_COMMUNES
    : CATEGORIES_RECETTE_PAR_ESPECE[activite];

/** Vrai pour une recette saisie comme une vente de production (lait, fromage, animaux, viande…). */
export const estCategorieVente = (categorie: string): categorie is CategorieVente =>
  (Object.values(CATEGORIE_VENTE) as string[]).includes(categorie);

/**
 * Libellé d'une recette pour une activité donnée. « Vente de cabris / d'agneaux » dépend de l'espèce de l'activité,
 * pas de l'espèce affichée ; pour « commun », on garde le libellé de l'espèce affichée.
 */
export function libelleRecetteActivite(categorie: CategorieRecette, activite: ActiviteComptable): string {
  if (categorie !== CATEGORIE_RECETTE.CABRIS) return LABEL_CATEGORIE_RECETTE[categorie];
  return `Vente ${de(petitsDe(activite === ACTIVITE_COMMUNE ? especeCourante() : activite))}`;
}

/**
 * Libellé d'une recette pour l'ensemble de l'établissement (écran Détail) : « Vente de cabris / d'agneaux » reprend
 * les petits des espèces qui en vendent, quelle que soit l'espèce affichée en ce moment.
 */
export function libelleRecetteEtablissement(categorie: CategorieRecette): string {
  if (categorie !== CATEGORIE_RECETTE.CABRIS) return LABEL_CATEGORIE_RECETTE[categorie];
  const vendeuses = especesActives().filter((e) =>
    (CATEGORIES_RECETTE_PAR_ESPECE[e] as readonly string[]).includes(categorie),
  );
  // Les anciennes ventes (avant le choix des espèces) sont des ventes de l'espèce par défaut.
  const petits = (vendeuses.length > 0 ? vendeuses : [ESPECE_PAR_DEFAUT]).map((e) => de(petitsDe(e)));
  return `Vente ${petits.join(' / ')}`;
}

export type GroupeRecette = ValeurDe<typeof GROUPE_RECETTE>;

/** Les groupes qu'une espèce peut cocher : tous ceux des ventes existantes, sauf la laiterie si elle n'a ni lait ni fromages. */
export const groupesCochables = (espece: string): GroupeRecetteDefinition[] =>
  TOUS_GROUPES_RECETTE_ANIMAUX.filter((g) => g.groupe !== 'laiterie' || ESPECES_LAITIERES.includes(espece));

/**
 * Les groupes de recettes (et leurs recettes) proposés pour une activité : ceux que l'utilisateur a cochés pour son espèce,
 * sinon ceux d'office.
 */
const groupesDe = (activite: ActiviteComptable): GroupeRecetteDefinition[] => {
  if (activite === ACTIVITE_COMMUNE) return groupesCommuns();
  const coches = choixGroupesRecette()[activite];
  if (!coches) return GROUPES_RECETTE_PAR_ESPECE[activite];
  const choisis = groupesCochables(activite).filter((g) => coches.includes(g.groupe));
  // Seules des catégories ajoutées sont cochées : « Autre recette » reste, il faut toujours une recette d'office.
  return choisis.length > 0
    ? choisis
    : GROUPES_RECETTE_PAR_ESPECE[activite].filter((g) => g.groupe === 'autre');
};

/** Vrai quand la laiterie / fromagerie est proposée à l'espèce : d'office aux chèvres et aux brebis, aux autres si elle est cochée. */
export const laiterieActive = (espece: string): boolean => groupesActifsEspece(espece).includes('laiterie');

/** Les groupes proposés pour une espèce (ses catégories de recette cochées, ou celles d'office). */
export const groupesActifsEspece = (espece: string): GroupeRecette[] =>
  groupesDe(espece as ActiviteComptable).map((g) => g.groupe);

/** Les recettes d'un groupe pour l'activité, dans l'ordre du groupe. */
export const categoriesGroupe = (groupe: GroupeRecette, activite: ActiviteComptable): CategorieRecette[] => [
  ...(groupesDe(activite).find((g) => g.groupe === groupe)?.categories ?? []),
];

/** Les groupes proposés pour une activité : pas de laiterie pour des cochons, par exemple. */
export const groupesRecetteActivite = (activite: ActiviteComptable): GroupeRecette[] =>
  groupesDe(activite).map((g) => g.groupe);

/** Le groupe d'une recette pour cette activité (la boucherie est un groupe à part pour les vaches et les cochons). */
export const groupeRecette = (categorie: CategorieRecette, activite: ActiviteComptable): GroupeRecette =>
  (groupesDe(activite).find((g) => g.categories.includes(categorie)) ?? groupesDe(activite)[0]).groupe;

/** La recette proposée d'abord pour une activité : la première de son premier groupe. */
export const premiereCategorieRecette = (activite: ActiviteComptable): CategorieRecette =>
  groupesDe(activite)[0].categories[0];
