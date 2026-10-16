import { comparerAlphabetique } from '@/shared/utils/personne';

/** Les n° de boucle d'un champ : séparés par des virgules, des points-virgules ou des espaces (vide : aucun). */
export const numerosDeBoucles = (texte: string | undefined): string[] =>
  (texte ?? '').split(/[,;\s]+/).filter(Boolean);

/** Vrai quand le champ des boucles d'un contrôle ou d'une visite nomme cette boucle. */
export const concerneLaBoucle = (champ: string | undefined, numeroBoucle: string | undefined): boolean =>
  !!numeroBoucle && numerosDeBoucles(champ).includes(numeroBoucle);

/** Le nombre de colonnes de la liste des boucles d'une visite. */
export const COLONNES_BOUCLES = 5;

/** Les valeurs réparties en colonnes qui se lisent de haut en bas, puis de gauche à droite (la première colonne est la plus remplie). */
export function repartirEnColonnes<T>(valeurs: T[], colonnes: number = COLONNES_BOUCLES): T[][] {
  const lignes = Math.ceil(valeurs.length / colonnes);
  return Array.from({ length: colonnes }, (_, c) => valeurs.slice(c * lignes, (c + 1) * lignes));
}

/** L'année de naissance d'un animal (« 2019 » pour 2019-12-16) ; vide quand elle n'est pas connue. */
export const anneeDeNaissance = (dateNaissance: string | undefined): string => dateNaissance?.slice(0, 4) ?? '';

/**
 * Les boucles dans l'ordre des visites et des contrôles : par année de naissance (la plus ancienne d'abord, l'année inconnue en
 * dernier), puis par numéro de boucle (2 avant 10). `anneeDe` donne l'année de naissance du porteur d'un numéro.
 */
export function trierParNaissance(numeros: string[], anneeDe: (numero: string) => string | undefined): string[] {
  const annee = (numero: string) => anneeDe(numero) || '9999';
  return [...numeros].sort((a, b) => annee(a).localeCompare(annee(b)) || comparerAlphabetique(a, b));
}
