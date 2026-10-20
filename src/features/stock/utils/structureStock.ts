import { articlesDuGenre, roleDeLaViande, type ArticleAffiche, type FiltreStock } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, ListeInventaire } from '@/features/stock/types';
import { categoriesAvecAjoutees, CATEGORIES, SECTIONS, type InfosCategorie, type Section } from '@/features/stock/utils/categories';
import { listeValablePour, retireePourToutes } from '@/features/stock/utils/listesEspece';
import { GENRE_ARTICLE, SECTION_STOCK } from '@/shared/constants/stock';

/**
 * La structure du stock, la même pour l'écran du stock et pour l'entrepôt : ainsi un changement dans l'un (une rubrique retirée, une liste
 * ajoutée, un article renommé) se retrouve tout de suite dans l'autre. Les règles de visibilité ne sont écrites qu'ici.
 */

export type SectionDuStock = (typeof SECTIONS)[number];

/** Les listes d'office visibles : celles de la fromagerie et des œufs seulement pour les espèces qui en ont, sans celles retirées pour toutes les espèces concernées. */
export function sectionsAffichees(
  archive: Pick<ArchiveStock, 'sectionsMasquees'>,
  fromagerie: boolean,
  poules: boolean,
  concernees: readonly string[],
): SectionDuStock[] {
  return SECTIONS.filter((x) => (fromagerie || !x.fromagerie) && (poules || !x.poules)).filter(
    (x) => !retireePourToutes(archive.sectionsMasquees?.[x.section], concernees),
  );
}

/** Les listes que l'utilisateur a ajoutées et qui valent pour les espèces concernées (pas de lait pour des cochons), non retirées. */
export function listesAffichees(archive: Pick<ArchiveStock, 'listes'>, concernees: readonly string[]): ListeInventaire[] {
  return (archive.listes ?? []).filter((l) => listeValablePour(l.compte, concernees) && !retireePourToutes(l.masquePour, concernees));
}

/**
 * Les articles d'une rubrique : un genre (filtré par activité), dont les lignes de viande se partagent entre deux catégories (les animaux et
 * les autres produits).
 */
export function articlesDeLaSection(
  genre: GenreArticle,
  section: Section | undefined,
  archive: ArchiveStock,
  filtre: FiltreStock,
  listeId?: string,
): ArticleAffiche[] {
  return articlesDuGenre(genre, archive, filtre, listeId).filter((a) =>
    genre !== GENRE_ARTICLE.VIANDE
      ? true
      : section === SECTION_STOCK.ANIMAUX
        ? roleDeLaViande(a.cle) !== undefined
        : roleDeLaViande(a.cle) === undefined,
  );
}

/** Une catégorie du stock telle qu'on la montre : son nom et son numéro, ses rubriques d'office et ses listes ajoutées. */
export interface CategorieDuStock extends InfosCategorie {
  sections: SectionDuStock[];
  listes: ListeInventaire[];
}

/**
 * Les catégories du stock à montrer, dans l'ordre de l'écran du stock : celles d'office puis celles ajoutées ; une catégorie d'office sans rien
 * à montrer n'y figure pas, une catégorie ajoutée si.
 */
export function categoriesDuStock(
  archive: Pick<ArchiveStock, 'categories' | 'reglagesCategories' | 'sectionsMasquees' | 'listes'>,
  fromagerie: boolean,
  poules: boolean,
  concernees: readonly string[],
): CategorieDuStock[] {
  const sections = sectionsAffichees(archive, fromagerie, poules, concernees);
  const listes = listesAffichees(archive, concernees);
  return categoriesAvecAjoutees(CATEGORIES, archive.categories, archive.reglagesCategories)
    .map((c) => ({
      ...c,
      sections: sections.filter((x) => x.categorie === c.categorie),
      listes: listes.filter((l) => l.categorie === c.categorie),
    }))
    .filter((c) => c.sections.length > 0 || c.listes.length > 0 || c.perso);
}
