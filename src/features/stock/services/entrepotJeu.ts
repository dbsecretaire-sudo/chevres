import type { CategorieDuStock } from '@/features/stock/utils/structureStock';
import { CATEGORIE_INVENTAIRE, GENRE_ARTICLE, SECTION_STOCK } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';

type Genre = ValeurDe<typeof GENRE_ARTICLE>;

/** Un article du stock tel que l'entrepôt le montre : sa carte (son dessin, son nom) et ce qu'il en reste. */
export interface CarteStock {
  cle: string;
  titre: string;
  emoji: string;
  niveau: number;
  /** L'unité de la quantité (« kg » pour un aliment, « L » pour le lait, « € » pour le prix des œufs) ; absente pour un nombre d'articles. */
  unite?: string;
  /** Où ouvrir le détail : la rubrique du stock (ou la catégorie, pour une liste ajoutée) : le paramètre `onglet` de l'écran du stock. */
  section: string;
}

/** Une rubrique du stock (« Ventes — Fromages », « Achat — Aliment ») avec ses cartes : l'entrepôt la montre comme l'écran du stock. */
export interface GroupeDeCartes {
  cle: string;
  titre: string;
  cartes: CarteStock[];
}

/** Le dessin de l'onglet d'une catégorie du stock (une catégorie ajoutée a le sien). */
export function emojiDeLaCategorie(categorie: string): string {
  switch (categorie) {
    case CATEGORIE_INVENTAIRE.PRODUITS_FINIS:
      return '🧀';
    case CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX:
      return '🐐';
    case CATEGORIE_INVENTAIRE.MATIERES_PREMIERES:
      return '🌾';
    case CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS:
      return '📦';
    case CATEGORIE_INVENTAIRE.IMMOBILISATIONS:
      return '🔧';
    default:
      return '🗂️';
  }
}

/** Le dessin d'un article : celui de son genre, ou plus précis quand son nom le dit (le foin, le maïs, la charcuterie). */
export function emojiDeLArticle(genre: Genre, libelle: string): string {
  const nom = libelle.toLowerCase();
  switch (genre) {
    case GENRE_ARTICLE.FROMAGE:
      return '🧀';
    case GENRE_ARTICLE.VIANDE:
      if (/chèvre|chevre|brebis|cabri|agneau|animal|veau|porcelet|poussin/.test(nom)) return '🐐';
      return /saucisson|jambon|charcut|pâté|terrine/.test(nom) ? '🥓' : '🥩';
    case GENRE_ARTICLE.ALIMENT:
      if (/ma[iï]s/.test(nom)) return '🌽';
      if (/foin|paille|herbe|luzerne|fourrage/.test(nom)) return '🌿';
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

/** L'unité de la quantité d'un genre d'article : les aliments se comptent en kilos ; le reste en nombre. */
export const uniteDuGenre = (genre: Genre): string | undefined => (genre === GENRE_ARTICLE.ALIMENT ? 'kg' : undefined);

/** Une quantité écrite en entier, avec ses milliers : 4 250, 12,5. Pas de « k » : 4 250 kg se lit 4 250 kg. */
export function formaterQuantite(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(Math.round(n * 10) / 10);
}

interface ArticleBrut {
  cle: string;
  libelle: string;
}

/** La carte du lait : ce qu'il en reste (en litres), d'après le bilan du lait. */
export const carteDuLait = (titre: string, litresRestants: number): CarteStock => ({
  cle: 'lait',
  titre,
  emoji: '🥛',
  niveau: litresRestants,
  unite: 'L',
  section: SECTION_STOCK.LAIT,
});

/** La carte des œufs : le stock n'en suit pas la quantité, seulement le prix de vente. */
export const carteDesOeufs = (titre: string, prix: number): CarteStock => ({
  cle: 'oeufs',
  titre,
  emoji: '🥚',
  niveau: prix,
  unite: '€',
  section: SECTION_STOCK.OEUFS,
});

/** Ce dont l'entrepôt a besoin pour lire le stock : les articles d'une rubrique, le niveau d'un article, le lait et les œufs. */
export interface LectureDuStock {
  articlesDe: (genre: Genre, section?: string, listeId?: string) => readonly ArticleBrut[];
  niveau: (cle: string) => number;
  /** La carte du lait (absente pour une espèce sans laiterie) et celle des œufs (absente sans poules). */
  lait?: CarteStock;
  oeufs?: CarteStock;
}

/**
 * Les rubriques d'une catégorie du stock avec leurs cartes, dans l'ordre de l'écran du stock : d'abord ses rubriques d'office (les fromages, le lait,
 * les aliments…), puis les listes que l'utilisateur y a ajoutées. Dans chaque rubrique, les articles qui ont du stock (positif ou négatif)
 * passent avant les autres.
 */
export function groupesDeLaCategorie(categorie: CategorieDuStock, lecture: LectureDuStock): GroupeDeCartes[] {
  const trier = (cartes: CarteStock[]) =>
    [...cartes].sort(
      (a, b) => Number(b.niveau !== 0) - Number(a.niveau !== 0),
    );
  const cartesDe = (genre: Genre, section: string | undefined, listeId: string | undefined, sectionDuDetail: string): CarteStock[] =>
    trier(
      lecture.articlesDe(genre, section, listeId).map((a) => ({
        cle: a.cle,
        titre: a.libelle,
        emoji: emojiDeLArticle(genre, a.libelle),
        niveau: lecture.niveau(a.cle),
        unite: uniteDuGenre(genre),
        section: sectionDuDetail,
      })),
    );
  const groupes: GroupeDeCartes[] = categorie.sections.map((s) => {
    let cartes: CarteStock[] = [];
    if (s.genre) cartes = cartesDe(s.genre, s.section, undefined, s.section);
    else if (s.section === SECTION_STOCK.LAIT && lecture.lait) cartes = [lecture.lait];
    else if (s.section === SECTION_STOCK.OEUFS && lecture.oeufs) cartes = [lecture.oeufs];
    return { cle: s.section, titre: s.titre, cartes };
  });
  for (const l of categorie.listes) {
    groupes.push({ cle: `liste:${l.id}`, titre: l.nom, cartes: cartesDe(GENRE_ARTICLE.PERSONNALISE, undefined, l.id, l.categorie) });
  }
  return groupes;
}

/** Combien d'articles d'une catégorie ont du stock (la pastille de son onglet). */
export const nombreEnStock = (groupes: readonly GroupeDeCartes[]): number =>
  groupes.reduce((total, g) => total + g.cartes.filter((c) => c.niveau > 0 && c.unite !== '€').length, 0);
