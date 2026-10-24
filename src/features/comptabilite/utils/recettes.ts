import type { ActiviteComptable, CategorieRecette, CategorieVente } from '@/features/comptabilite/types';
import { groupeRecetteAutorise } from '@/features/clients/services/categorie';
import { GROUPES_RECETTE_SANS_CLIENT } from '@/shared/constants/clients';
import { ESPECES_SANS_PRODUCTION } from '@/shared/constants/stock';
import type { Client } from '@/features/clients/types';
import { nomComplet } from '@/shared/utils/personne';
import {
  CATEGORIES_RECETTE_COMMUNES,
  CATEGORIES_RECETTE_PAR_ESPECE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  GROUPES_RECETTE_COMMUNS,
  GROUPES_RECETTE_PAR_ESPECE,
  GROUPE_RECETTE,
  type GroupeRecetteDefinition,
} from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import {
  ESPECE_PAR_DEFAUT,
  de,
  especeCourante,
  especesActives,
  petitsDe,
} from '@/shared/dictionnaire/animaux';
import { LABEL_CATEGORIE_RECETTE } from '@/shared/textes/libelles';

/** Catégories de recette proposées pour une activité : celles de son espèce, ou seulement aide et autre si « commun ». */
export const categoriesRecetteActivite = (activite: ActiviteComptable): readonly CategorieRecette[] =>
  activite === ACTIVITE_COMMUNE
    ? CATEGORIES_RECETTE_COMMUNES
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

/**
 * Les groupes de recettes (et leurs recettes) proposés pour une activité : ceux de son espèce, qui reprennent les listes de
 * l'inventaire (fromages et lait, œufs, animaux, boucherie et charcuterie), puis l'aide et le reste. Les listes que l'utilisateur
 * ajoute à l'inventaire s'y ajoutent (voir categoriesRecetteInventaire).
 */
const groupesDe = (activite: ActiviteComptable): GroupeRecetteDefinition[] =>
  activite === ACTIVITE_COMMUNE ? GROUPES_RECETTE_COMMUNS : GROUPES_RECETTE_PAR_ESPECE[activite];

/** Vrai quand la laiterie / fromagerie est proposée à l'espèce : aux chèvres, aux brebis et aux vaches. */
export const laiterieActive = (espece: string): boolean =>
  groupesActifsEspece(espece).includes(GROUPE_RECETTE.LAIT);

/** Vrai quand l'espèce a une production (tous les élevages, pas les animaux de compagnie). */
export const productionActive = (espece: string): boolean => !ESPECES_SANS_PRODUCTION.includes(espece);

/** Vrai quand la vente d'œufs est proposée à l'espèce (les poules). */
export const oeufsActifs = (espece: string): boolean =>
  groupesActifsEspece(espece).includes(GROUPE_RECETTE.OEUFS);

/** Les groupes proposés pour une espèce. */
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

/**
 * Les clients qui peuvent recevoir une recette déjà saisie (sa catégorie ne change pas) : celle de leur catégorie de client. L'aide est
 * celle des organismes ; le client déjà inscrit sur l'écriture reste proposé, même si sa catégorie a changé depuis.
 */
export const clientsPourLaRecette = (
  clients: Client[],
  categorie: CategorieRecette | undefined,
  activite: ActiviteComptable,
  actuel?: string,
): Client[] => {
  if (!categorie) return clients;
  const groupe = groupeRecette(categorie, activite);
  return clients.filter((c) => nomComplet(c) === actuel || groupeRecetteAutorise(c, groupe));
};

/** Les groupes de recette que l'exploitation propose (ceux de ses espèces) : les choix d'une catégorie de client. */
export const groupesRecetteProposes = (): GroupeRecette[] => {
  const groupes = Object.values(GROUPES_RECETTE_PAR_ESPECE).flat();
  return groupes
    .map((g) => g.groupe)
    .filter((g, i, tous) => tous.indexOf(g) === i && !GROUPES_RECETTE_SANS_CLIENT.includes(g));
};
