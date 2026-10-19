import { GENRE_ARTICLE, SECTION_STOCK } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';

type Genre = ValeurDe<typeof GENRE_ARTICLE>;

/** Un article du stock tel que l'entrepôt le montre : sa carte (son dessin, son nom) et ce qu'il en reste. */
export interface CarteStock {
  cle: string;
  /** Le genre de l'article ; absent pour le lait, qui n'est pas un article mais un bilan en litres. */
  genre?: Genre;
  /** L'unité de la quantité (« L » pour le lait) ; absente pour un nombre d'articles. */
  unite?: string;
  titre: string;
  emoji: string;
  niveau: number;
  /** La rubrique du stock qui détaille cet article (le paramètre `onglet` de l'écran du stock). */
  section: string;
}

/** Un onglet de l'entrepôt : son dessin et les genres d'articles qu'il rassemble. */
export interface OngletEntrepot {
  cle: 'vente' | 'aliments' | 'consommables' | 'materiel';
  emoji: string;
  genres: readonly Genre[];
}

/** Les quatre onglets de l'entrepôt : ce qui se vend, ce qui nourrit, ce qui se consomme, ce qui dure. */
export const ONGLETS_ENTREPOT: readonly OngletEntrepot[] = [
  { cle: 'vente', emoji: '🧀', genres: [GENRE_ARTICLE.FROMAGE, GENRE_ARTICLE.VIANDE] },
  { cle: 'aliments', emoji: '🌾', genres: [GENRE_ARTICLE.ALIMENT] },
  { cle: 'consommables', emoji: '📦', genres: [GENRE_ARTICLE.EMBALLAGE, GENRE_ARTICLE.ENTRETIEN, GENRE_ARTICLE.EQUIPEMENT, GENRE_ARTICLE.BOUCLE] },
  { cle: 'materiel', emoji: '🔧', genres: [GENRE_ARTICLE.MATERIEL, GENRE_ARTICLE.BATIMENT, GENRE_ARTICLE.PERSONNALISE] },
];

/** La rubrique du stock où un genre d'article se détaille. */
export function sectionDuGenre(genre: Genre): string {
  switch (genre) {
    case GENRE_ARTICLE.FROMAGE:
      return SECTION_STOCK.FROMAGES;
    case GENRE_ARTICLE.VIANDE:
      return SECTION_STOCK.VIANDE;
    case GENRE_ARTICLE.ALIMENT:
      return SECTION_STOCK.ALIMENTS;
    case GENRE_ARTICLE.EMBALLAGE:
      return SECTION_STOCK.EMBALLAGES;
    case GENRE_ARTICLE.BOUCLE:
      return SECTION_STOCK.BOUCLES;
    case GENRE_ARTICLE.ENTRETIEN:
      return SECTION_STOCK.ENTRETIEN;
    case GENRE_ARTICLE.EQUIPEMENT:
      return SECTION_STOCK.EQUIPEMENT;
    default:
      return SECTION_STOCK.MATERIEL;
  }
}

/** Le dessin d'un article : celui de son genre, ou plus précis quand son nom le dit (le foin, le maïs, les fromages de chèvre). */
export function emojiDeLArticle(genre: Genre, libelle: string): string {
  const nom = libelle.toLowerCase();
  switch (genre) {
    case GENRE_ARTICLE.FROMAGE:
      return '🧀';
    case GENRE_ARTICLE.VIANDE:
      return /saucisson|jambon|charcut|pâté|terrine/.test(nom) ? '🥓' : '🥩';
    case GENRE_ARTICLE.ALIMENT:
      if (/ma[iï]s/.test(nom)) return '🌽';
      if (/foin|paille|herbe|luzerne|fourrage/.test(nom)) return '🌿';
      if (/orge|bl[eé]|avoine|c[eé]r[eé]ale|granul|concentr/.test(nom)) return '🌾';
      return '🌾';
    case GENRE_ARTICLE.EMBALLAGE:
      return '📦';
    case GENRE_ARTICLE.ENTRETIEN:
      return '🧽';
    case GENRE_ARTICLE.EQUIPEMENT:
      return '🧤';
    case GENRE_ARTICLE.BOUCLE:
      return '🏷️';
    case GENRE_ARTICLE.BATIMENT:
      return '🏗️';
    case GENRE_ARTICLE.MATERIEL:
      return '🔧';
    default:
      return '🗂️';
  }
}

/** Une quantité en peu de place, comme le prix d'une carte de jeu : 90, 1,2 k, 28,8 k (arrondie, sans décimale en dessous de 1 000). */
export function formaterQuantite(n: number): string {
  const signe = n < 0 ? '-' : '';
  const v = Math.abs(n);
  if (v < 1000) return `${signe}${Math.round(v * 10) / 10 === Math.round(v) ? Math.round(v) : String(Math.round(v * 10) / 10).replace('.', ',')}`;
  const k = Math.round((v / 1000) * 10) / 10;
  return `${signe}${String(k).replace('.', ',')} k`;
}

interface ArticleBrut {
  cle: string;
  libelle: string;
}

/**
 * Les cartes d'un onglet : les articles de ses genres avec leur niveau, ceux qui en ont (positif ou négatif) d'abord, puis les autres, par
 * nom. Une ligne qui suit le cheptel (les cabris, l'animal sur pied, l'animal vivant) en fait partie si `estLigneDuCheptel` ne l'écarte pas : sa
 * quantité est celle du troupeau, que les niveaux donnent déjà.
 */
export function cartesDeLOnglet(
  onglet: OngletEntrepot,
  articlesParGenre: ReadonlyMap<Genre, readonly ArticleBrut[]>,
  niveaux: ReadonlyMap<string, number>,
  estLigneDuCheptel: (cle: string) => boolean,
  /** Des cartes en plus, pour l'onglet « à vendre » seulement (le lait). */
  enPlus: readonly CarteStock[] = [],
): CarteStock[] {
  const cartes: CarteStock[] = onglet.cle === 'vente' ? [...enPlus] : [];
  for (const genre of onglet.genres) {
    for (const a of articlesParGenre.get(genre) ?? []) {
      if (estLigneDuCheptel(a.cle)) continue;
      cartes.push({
        cle: a.cle,
        genre,
        titre: a.libelle,
        emoji: emojiDeLArticle(genre, a.libelle),
        niveau: niveaux.get(a.cle) ?? 0,
        section: sectionDuGenre(genre),
      });
    }
  }
  return cartes.sort((a, b) => Number(b.niveau !== 0) - Number(a.niveau !== 0) || a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
}

/** Combien d'articles d'un onglet ont du stock (la pastille de l'onglet). */
export const nombreEnStock = (cartes: readonly CarteStock[]): number => cartes.filter((c) => c.niveau > 0).length;

/** La carte du lait : ce qu'il en reste (en litres), d'après le bilan du lait ; sa rubrique est celle du lait dans le stock. */
export const carteDuLait = (titre: string, litresRestants: number): CarteStock => ({
  cle: 'lait',
  titre,
  emoji: '🥛',
  niveau: litresRestants,
  unite: 'L',
  section: SECTION_STOCK.LAIT,
});
