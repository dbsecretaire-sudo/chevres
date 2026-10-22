import type { BesoinFormule, FormuleAgritourisme, StockDeVisite } from '@/features/commercial/types';
import { articlesDuGenre, estLigneDuCheptel, type ArticleAffiche } from '@/features/stock/services/stock';
import { estArticleAvecLots, lotsAChoisir } from '@/features/stock/services/lots';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

/** Ce qu'une visite doit sortir du stock pour un article : la quantité totale. */
export interface BesoinDeVisite {
  article: string;
  quantite: number;
}

/**
 * Le stock qu'une visite demande d'après sa formule : pour chaque besoin, sa quantité (multipliée par le nombre de personnes quand elle est « par
 * personne »). Deux besoins du même article s'additionnent.
 */
export function besoinsDeLaVisite(formule: Pick<FormuleAgritourisme, 'besoins'> | undefined, participants: number): BesoinDeVisite[] {
  const parArticle = new Map<string, number>();
  for (const b of formule?.besoins ?? []) {
    if (!b.article || !(b.quantite > 0)) continue;
    const quantite = b.parPersonne ? b.quantite * Math.max(0, participants) : b.quantite;
    parArticle.set(b.article, (parArticle.get(b.article) ?? 0) + quantite);
  }
  return [...parArticle].map(([article, quantite]) => ({ article, quantite }));
}

/** Un produit de l'inventaire qu'une formule peut consommer, rangé par catégorie (fromages, charcuterie et viande, plats, matières alimentaires…). */
export interface ArticleDeBesoin extends ArticleAffiche {
  groupe: string;
}

/**
 * Les produits du stock qu'une formule peut demander : les fromages, la charcuterie et la viande de l'inventaire (hors les lignes qui suivent le cheptel),
 * les plats préparés, puis les articles des listes ajoutées à l'inventaire (matières alimentaires : farine, œufs, huile d'olive…), chacun rangé sous le nom de
 * sa liste.
 */
export function articlesDeBesoin(
  archive: ArchiveStock,
  groupes: { fromages: string; charcuterie: string; plats: string; autres: string },
): ArticleDeBesoin[] {
  const nomsDesListes = new Map((archive.listes ?? []).map((l) => [l.id, l.nom]));
  return [
    ...articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive).map((a) => ({ ...a, groupe: groupes.fromages })),
    ...articlesDuGenre(GENRE_ARTICLE.VIANDE, archive)
      .filter((a) => !estLigneDuCheptel(a.cle))
      .map((a) => ({ ...a, groupe: groupes.charcuterie })),
    ...articlesDuGenre(GENRE_ARTICLE.PLAT, archive).map((a) => ({ ...a, groupe: groupes.plats })),
    ...articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive).map((a) => ({
      ...a,
      groupe: (a.id ? nomsDesListes.get(archive.articles.find((x) => x.id === a.id)?.listeId ?? '') : undefined) ?? groupes.autres,
    })),
  ];
}

/** Les besoins d'une formule saisis : ceux dont l'article et la quantité sont valides. */
export const besoinsValides = (besoins: readonly BesoinFormule[]): BesoinFormule[] =>
  besoins.filter((b) => b.article && b.quantite > 0).map((b) => ({ article: b.article, quantite: b.quantite, parPersonne: b.parPersonne || undefined }));

/** Les lots qu'on peut prendre pour un article, les plus anciens d'abord (les fromages frais se font peu avant : on sort les plus vieux). Rien pour un article sans lots. */
export function lotsPourVisite(archive: Pick<ArchiveStock, 'lots'>, article: string, visiteId?: string): LotFromage[] {
  if (!estArticleAvecLots(article)) return [];
  return [...lotsAChoisir(archive, article, visiteId)].sort(
    (a, b) => a.dateFabrication.localeCompare(b.dateFabrication) || a.numero.localeCompare(b.numero, undefined, { numeric: true }),
  );
}

/** Le choix proposé d'office : les lots les plus anciens, autant que la quantité demandée (ou que de lots en stock). */
export function choixParDefaut(besoins: readonly BesoinDeVisite[], archive: Pick<ArchiveStock, 'lots'>, visiteId?: string): StockDeVisite[] {
  return besoins.map((b) => ({
    article: b.article,
    quantite: b.quantite,
    lotIds: lotsPourVisite(archive, b.article, visiteId)
      .slice(0, Math.max(0, Math.floor(b.quantite)))
      .map((l) => l.id),
  }));
}

/** Vrai quand un choix est permis : jamais plus de lots que de quantité demandée. */
export const choixValide = (choix: readonly StockDeVisite[]): boolean => choix.every((c) => c.lotIds.length <= Math.max(0, Math.floor(c.quantite)));
