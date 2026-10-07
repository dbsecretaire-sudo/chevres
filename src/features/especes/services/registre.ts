import type { DefinitionEspece } from '@/features/especes/types';
import {
  CATEGORIES_RECETTE_PAR_ESPECE,
  GROUPES_RECETTE_PAR_ESPECE,
  TYPES_ALIMENT_PAR_ESPECE,
  TYPE_ALIMENT,
} from '@/shared/constants/comptabilite';
import { PARAMETRES_ESPECE } from '@/shared/constants/cheptel';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { JOURS_PAR_SEMAINE, UNITE_DUREE } from '@/shared/constants/temps';
import { DICTIONNAIRE_ANIMAUX, terme, type Vocabulaire } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE, LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

import type { Duree } from '@/shared/utils/age';

/** Les identifiants des espèces ajoutées par l'utilisateur (dans l'ordre où il les a ajoutées). */
let ajoutees: string[] = [];

/** L'espèce sert de base à celles qu'on ajoute : ses catégories de recette (viande, boucherie, aide, autre). */
const ESPECE_DE_BASE = TYPE_ANIMAL_ETABLISSEMENT.COCHONS;

/** Toutes les espèces : celles d'office, puis celles que l'utilisateur a ajoutées. */
export const toutesLesEspeces = (): string[] => [...Object.values(TYPE_ANIMAL_ETABLISSEMENT), ...ajoutees];

export const estEspeceOffice = (id: string): boolean =>
  (Object.values(TYPE_ANIMAL_ETABLISSEMENT) as string[]).includes(id);

/** « 16 semaines » devient « 112 jours » : seuls les jours et les mois se saisissent. */
const enJoursOuMois = (duree: Duree): Duree =>
  duree.unite === UNITE_DUREE.SEMAINES
    ? { valeur: duree.valeur * JOURS_PAR_SEMAINE, unite: UNITE_DUREE.JOURS }
    : duree;

/** Ce que l'application utilise aujourd'hui pour une espèce (le point de départ du formulaire de modification). */
export function definitionActuelle(id: string): DefinitionEspece {
  const mots = DICTIONNAIRE_ANIMAUX[id];
  const seuils = PARAMETRES_ESPECE[id];
  return {
    id,
    nom: LABEL_TYPE_ANIMAL_ETABLISSEMENT[id] ?? id,
    ageSevrage: enJoursOuMois(seuils.ageSevrage),
    agePetitMax: enJoursOuMois(seuils.agePetitMax),
    nbPetitsMax: seuils.nbPetitsMax,
    femelle: mots.femelle.singulier,
    male: mots.male.singulier,
    petit: mots.petit.singulier,
  };
}

const majuscule = (texte: string): string => texte.charAt(0).toUpperCase() + texte.slice(1);

/** Le singulier d'un nom d'espèce saisi au pluriel (« Lapins » → « Lapin ») pour « Lapin sur pied », « Lapin vivant ». */
const singulier = (nom: string): string => (nom.length > 3 && nom.endsWith('s') ? nom.slice(0, -1) : nom);

/** Le pluriel d'un nom : « lapereau » → « lapereaux », « cheval » → « chevaux », « brebis » ne change pas, sinon on ajoute un « s ». */
const pluriel = (mot: string): string => {
  if (/[sxz]$/i.test(mot)) return mot;
  if (/eau$|au$/i.test(mot)) return `${mot}x`;
  if (/al$/i.test(mot)) return `${mot.slice(0, -2)}aux`;
  return `${mot}s`;
};
const termeFrancais = (mot: string) => terme(mot, pluriel(mot));

/** Un mot dont le singulier n'a pas changé garde son pluriel (« brebis ») ; sinon on ajoute un « s ». */
const motModifie = (ancien: { singulier: string; pluriel: string }, nouveau: string) =>
  nouveau === ancien.singulier ? ancien : termeFrancais(nouveau);

/**
 * Met une espèce (ajoutée, ou d'office modifiée) dans tous les dictionnaires de l'application : ses mots, ses seuils d'âge,
 * son nom, et — pour une espèce ajoutée — ses recettes et ses aliments de départ.
 */
export function appliquerEspece(definition: DefinitionEspece): void {
  const { id } = definition;
  const existante = DICTIONNAIRE_ANIMAUX[id] as Vocabulaire | undefined;
  const petitChange = !existante || definition.petit !== existante.petit.singulier;
  const office = estEspeceOffice(id);
  const base: Vocabulaire = existante ?? {
    troupeau: '',
    femelle: termeFrancais(definition.femelle),
    male: termeFrancais(definition.male),
    petit: termeFrancais(definition.petit),
    petitFemelle: '',
    petitMale: '',
    surPied: '',
    vivant: '',
    produits: ['animaux'],
  };
  DICTIONNAIRE_ANIMAUX[id] = {
    ...base,
    femelle: existante ? motModifie(existante.femelle, definition.femelle) : base.femelle,
    male: existante ? motModifie(existante.male, definition.male) : base.male,
    petit: existante ? motModifie(existante.petit, definition.petit) : base.petit,
    petitFemelle: petitChange ? majuscule(definition.petit) : base.petitFemelle,
    petitMale: petitChange ? majuscule(definition.petit) : base.petitMale,
    troupeau: office ? base.troupeau : `Troupeau ${definition.nom}`,
    surPied: office ? base.surPied : `${majuscule(singulier(definition.nom))} sur pied`,
    vivant: office ? base.vivant : `${majuscule(singulier(definition.nom))} vivant`,
  };
  PARAMETRES_ESPECE[id] = {
    agePetitMax: definition.agePetitMax,
    ageSevrage: definition.ageSevrage,
    nbPetitsMax: definition.nbPetitsMax,
  };
  LABEL_TYPE_ANIMAL_ETABLISSEMENT[id] = definition.nom;
  LABEL_ACTIVITE_COMPTABLE[id] = definition.nom;
  if (!estEspeceOffice(id)) {
    GROUPES_RECETTE_PAR_ESPECE[id] = GROUPES_RECETTE_PAR_ESPECE[ESPECE_DE_BASE];
    CATEGORIES_RECETTE_PAR_ESPECE[id] = CATEGORIES_RECETTE_PAR_ESPECE[ESPECE_DE_BASE];
    TYPES_ALIMENT_PAR_ESPECE[id] = [
      TYPE_ALIMENT.FOURRAGE,
      TYPE_ALIMENT.CEREALES,
      TYPE_ALIMENT.SEL,
      TYPE_ALIMENT.AUTRE,
    ];
    if (!ajoutees.includes(id)) ajoutees = [...ajoutees, id];
  }
}

/** Retire une espèce ajoutée de tous les dictionnaires. */
export function retirerEspece(id: string): void {
  if (estEspeceOffice(id)) return;
  delete DICTIONNAIRE_ANIMAUX[id];
  delete PARAMETRES_ESPECE[id];
  delete LABEL_TYPE_ANIMAL_ETABLISSEMENT[id];
  delete LABEL_ACTIVITE_COMPTABLE[id];
  delete GROUPES_RECETTE_PAR_ESPECE[id];
  delete CATEGORIES_RECETTE_PAR_ESPECE[id];
  delete TYPES_ALIMENT_PAR_ESPECE[id];
  ajoutees = ajoutees.filter((e) => e !== id);
}
