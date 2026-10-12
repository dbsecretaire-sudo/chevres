import { CATEGORIES_RECETTE_PAR_ESPECE } from '@/shared/constants/comptabilite';
import { COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';

/**
 * Vrai quand une liste de l'inventaire vaut pour l'une de ces espèces. Une liste de ventes dont le compte est celui d'une recette
 * (« Ventes — Lait », « Ventes — Fromage ») n'est proposée qu'aux espèces qui la vendent : pas de lait pour des cochons. Les autres
 * listes (celles que l'utilisateur ajoute avec un autre compte) valent pour toutes les espèces.
 */
export function listeValablePour(compte: string, especes: readonly string[]): boolean {
  const recettes = Object.entries(COMPTE_PAR_RECETTE)
    .filter(([, c]) => c.numero === compte)
    .map(([categorie]) => categorie);
  if (recettes.length === 0) return true;
  return especes.some((espece) =>
    recettes.some((categorie) => (CATEGORIES_RECETTE_PAR_ESPECE[espece] ?? []).some((c) => c === categorie)),
  );
}

/** Vrai quand toutes les espèces concernées ont retiré la liste (son compte a été retiré pour elles) : elle n'est plus montrée. */
export const retireePourToutes = (
  masquePour: readonly string[] | undefined,
  especes: readonly string[],
): boolean => especes.length > 0 && especes.every((e) => (masquePour ?? []).includes(e));
