import { choixParDefaut, lotsPourVisite } from '@/features/commercial/services/stockVisite';
import {
  articlesDuGenre,
  libelleArticle,
  niveauxDeStock,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { TEXTES } from '@/shared/textes';
import { CLE_PRIX_LAIT, GENRE_ARTICLE, INGREDIENTS_DE_FROMAGERIE } from '@/shared/constants/stock';
import { CLE_LAIT } from '@/features/stock/services/historiqueLait';

/** Un article du stock qu'un plat peut utiliser, rangé par groupe (consommables, produits animaux, conditionnement, lait). */
export interface IngredientProposable extends ArticleAffiche {
  groupe: string;
}

/**
 * Les groupes où l'on range les ingrédients : les mêmes pour tous les produits, comme dans la bibliothèque de recettes, pour que le choix se lise partout pareil.
 */
export interface GroupesDesIngredients {
  fromages: string;
  charcuterie: string;
  autres: string;
  fromagerie: string;
  animaux: string;
  conditionnement: string;
  lait: string;
}
export const GROUPES_DES_INGREDIENTS: GroupesDesIngredients = {
  fromages: TEXTES.production.fabricationPlat.ingredients.groupeFromages,
  charcuterie: TEXTES.production.fabricationPlat.ingredients.groupeCharcuterie,
  autres: TEXTES.production.fabricationPlat.ingredients.groupeAutres,
  fromagerie: TEXTES.production.recettes.groupeFromagerie,
  animaux: TEXTES.production.recettes.groupeAnimaux,
  conditionnement: TEXTES.production.recettes.groupeConditionnement,
  lait: TEXTES.production.recettes.groupeLait,
};

/**
 * Les articles du stock qu'une recette peut demander, rangés en groupes :
 * - un fromage ou une charcuterie : la présure, le sel et les ferments, les consommables de la liste, les fromages, la viande et le cabri (cheptel compris),
 *   le conditionnement, et le lait de chèvre ;
 * - un plat préparé : les fromages et la viande (hors cheptel), les articles des listes de l'inventaire, le conditionnement ;
 * - un savon : le lait de chèvre, les articles des listes de l'inventaire (huiles, soude…) et le conditionnement, ni fromage ni viande.
 */
export function ingredientsProposables(
  archive: ArchiveStock,
  groupes: Partial<GroupesDesIngredients> = {},
  /** Un fromage ou une charcuterie (`fromagerie`) ; un savon (`listesSeulement`). Un plat préparé n'a pas d'option. */
  options: { listesSeulement?: boolean; fromagerie?: boolean } = {},
): IngredientProposable[] {
  const g = { ...GROUPES_DES_INGREDIENTS, ...groupes };
  // La présure, le sel et les ferments d'office : des consommables, comme ceux qu'on ajoute dans la liste Consommables.
  const consommablesDOffice = articlesDuGenre(GENRE_ARTICLE.MATERIEL, archive).filter((a) =>
    INGREDIENTS_DE_FROMAGERIE.includes(a.cle.split(':')[1]),
  );
  // Le conditionnement : le contenu des emballages (boîtes, bocaux, sachets…).
  const conditionnement = articlesDuGenre(GENRE_ARTICLE.EMBALLAGE, archive).map((a) => ({ ...a, groupe: g.conditionnement }));
  // Les articles des listes ajoutées à l'inventaire (légumes, bocaux, épices, huiles…), rangés dans les consommables.
  // Un article de liste déjà ajouté au stock des consommables (même nom) n'est pas proposé deux fois.
  const nomsDesConsommables = new Set(articlesDuGenre(GENRE_ARTICLE.EQUIPEMENT, archive).map((a) => a.libelle.trim().toLowerCase()));
  const listes = articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive)
    .filter((a) => !nomsDesConsommables.has(a.libelle.trim().toLowerCase()))
    .map((a) => ({ ...a, groupe: g.fromagerie }));
  // Le lait de chèvre de l'inventaire : il n'est pas un article, ce sont des litres (comme au lait saisi pour une fabrication).
  const lait = { cle: CLE_LAIT, libelle: 'Lait de chèvre', groupe: g.lait };

  if (options.fromagerie)
    return [
      ...consommablesDOffice.map((a) => ({ ...a, groupe: g.fromagerie })),
      // Les consommables de la liste (sel, présure, ferments, fourniture ajoutée…) : la source des ingrédients d'un fromage.
      ...articlesDuGenre(GENRE_ARTICLE.EQUIPEMENT, archive)
        .filter((a) => !consommablesDOffice.some((m) => m.libelle === a.libelle))
        .map((a) => ({ ...a, groupe: g.fromagerie })),
      // Les produits fabriqués : le fromage, la viande, le cabri et la charcuterie (les plats et savons ne sont pas des ingrédients).
      ...articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive).map((a) => ({ ...a, groupe: g.animaux })),
      ...articlesDuGenre(GENRE_ARTICLE.VIANDE, archive).map((a) => ({ ...a, groupe: g.animaux })),
      ...conditionnement,
      lait,
    ];

  // Les consommables de l'inventaire (huiles, soude, sucre, présure…) : un savon ou un plat les prend comme un fromage.
  const consommables = articlesDuGenre(GENRE_ARTICLE.EQUIPEMENT, archive).map((a) => ({ ...a, groupe: g.fromagerie }));

  if (options.listesSeulement) return [lait, ...consommables, ...listes, ...conditionnement];

  return [
    ...articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive).map((a) => ({ ...a, groupe: g.fromages })),
    ...articlesDuGenre(GENRE_ARTICLE.VIANDE, archive).map((a) => ({ ...a, groupe: g.animaux })),
    ...consommables,
    ...listes,
    ...conditionnement,
    // Le lait de chèvre entre dans un plat (il sort en litres, comme pour un savon).
    lait,
  ];
}

/** Un ingrédient en cours de saisie : la quantité reste du texte ; les lots choisis (absents : les plus anciens, d'office). */
export interface SaisieIngredient {
  cle: string;
  article: string;
  quantite: string;
  lotIds?: string[];
  /** L'unité de la quantité saisie (une recette : « g » pour du sel en kilos) ; absente : celle du stock. */
  unite?: string;
}

/** Un ingrédient dont le stock ne suffit pas : ce qu'il y a, ce qui est demandé. */
export interface IngredientEnManque {
  libelle: string;
  enStock: number;
  demande: number;
}

/**
 * Les ingrédients d'une fabrication dont le stock ne suffit pas (huile, soude, présure, sel…) : sans cela le stock passerait en négatif sans prévenir. Un même
 * article cité deux fois compte pour la somme de ses quantités.
 */
export function ingredientsEnManque(
  archive: ArchiveStock,
  utilises: { article: string; quantite: number }[],
): IngredientEnManque[] {
  const niveaux = niveauxDeStock(archive.mouvements);
  const demandes = new Map<string, number>();
  // Le lait n'a pas de stock tenu article par article (son bilan est à part) : il ne déclenche jamais l'alerte.
  for (const u of utilises.filter((x) => x.article !== CLE_PRIX_LAIT && !x.article.startsWith(`${CLE_PRIX_LAIT}:`))) demandes.set(u.article, (demandes.get(u.article) ?? 0) + u.quantite);
  const arrondi = (n: number) => Math.round(n * 1000) / 1000;
  return [...demandes]
    .map(([article, demande]) => ({
      libelle: libelleArticle(article, archive),
      enStock: arrondi(niveaux.get(article) ?? 0),
      demande: arrondi(demande),
    }))
    .filter((i) => i.demande > i.enStock);
}

/** Les lots qu'un ingrédient peut prendre (ceux en stock, les plus anciens d'abord) : rien pour un article sans suivi par lot. */
export const lotsDeLIngredient = (archive: Pick<ArchiveStock, 'lots'>, article: string): LotFromage[] =>
  lotsPourVisite(archive, article);

/** Les lots pris pour un ingrédient : ceux choisis, sinon les plus anciens, autant que la quantité entière demandée. */
export function lotsPrisPourIngredient(
  archive: Pick<ArchiveStock, 'lots'>,
  ingredient: Pick<SaisieIngredient, 'article' | 'lotIds'>,
  quantite: number,
): string[] {
  if (ingredient.lotIds) return ingredient.lotIds;
  return choixParDefaut([{ article: ingredient.article, quantite }], archive)[0]?.lotIds ?? [];
}

/** Les unités d'une recette, au singulier et au pluriel : « 1 pièce », « 3 pièces », « 3 litres ». */
const UNITES_EN_PHRASE: Record<string, [singulier: string, pluriel: string]> = {
  g: ['g', 'g'],
  kg: ['kg', 'kg'],
  cl: ['cl', 'cl'],
  ml: ['ml', 'ml'],
  L: ['litre', 'litres'],
  pièce: ['pièce', 'pièces'],
};

/**
 * L'unité qui se lit le mieux : moins d'un kilo se dit en grammes, moins d'un litre en centilitres, moins d'un centilitre en millilitres. Le reste ne change pas.
 */
function uniteLisible(quantite: number, cle: string): { quantite: number; cle: string } {
  if (cle === 'kg' && quantite < 1) return { quantite: quantite * 1000, cle: 'g' };
  if (cle === 'L' && quantite < 1) return quantite * 100 < 1 ? { quantite: quantite * 1000, cle: 'ml' } : { quantite: quantite * 100, cle: 'cl' };
  if (cle === 'cl' && quantite < 1) return { quantite: quantite * 10, cle: 'ml' };
  return { quantite, cle };
}

/**
 * Une ligne d'ingrédient de recette, en phrase : « 0,05 kg de sel », « 3 litres de lait de chèvre », « 1 pièce de papier alimentaire ». Le lait se compte en
 * litres ; sans unité enregistrée, c'est celle du stock ; sans unité du tout, la quantité se dit devant le nom.
 */
export function libelleIngredientDeRecette(
  i: { article: string; quantite: number; unite?: string },
  archive: ArchiveStock,
): string {
  const estLait = i.article === CLE_LAIT;
  const libelle = estLait ? 'lait de chèvre' : libelleArticle(i.article, archive);
  const nom = libelle.charAt(0).toLowerCase() + libelle.slice(1);
  const cle = estLait ? 'L' : (i.unite ?? archive.unites?.[i.article]);
  const lisible = cle ? uniteLisible(i.quantite, cle) : { quantite: i.quantite, cle: '' };
  const quantite = lisible.quantite.toLocaleString('fr-FR', { maximumFractionDigits: 6 });
  const unite = UNITES_EN_PHRASE[lisible.cle];
  if (!unite) return `${quantite} ${nom}`;
  const [singulier, pluriel] = unite;
  const de = /^[aeiouyhéèêâàôîùû]/i.test(nom) ? 'd’' : 'de ';
  return `${quantite} ${lisible.quantite === 1 ? singulier : pluriel} ${de}${nom}`;
}
