import { verdictDeLAnalyse, type Verdict } from '@/features/analyses/services/analysesProduits';
import type { AnalyseProduit, ProduitAnalyse } from '@/features/settings/settings';
import { estArticleSavon } from '@/features/stock/services/dossiersSavons';
import { estArticleFromage, estArticlePlat } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

/** Les produits dont on tient le registre : ceux qu'on fabrique et qui se suivent lot par lot. */
export const PRODUITS_DU_REGISTRE: readonly ProduitAnalyse[] = ['fromage', 'charcuterie', 'plat', 'savon'];

/** Le produit d'analyse d'un article de l'inventaire suivi par lot ; rien pour un article sans lots (un animal du cheptel, un emballage…). */
export function produitAnalyseDeLArticle(article: string): ProduitAnalyse | undefined {
  if (estArticleFromage(article)) return 'fromage';
  if (estArticlePlat(article)) return 'plat';
  if (estArticleSavon(article)) return 'savon';
  return article.startsWith(`${GENRE_ARTICLE.VIANDE}:`) ? 'charcuterie' : undefined;
}

/** Une fabrication (les lots nés ensemble d'un même mouvement de stock) : de quoi lui rattacher ses analyses. */
export interface FabricationDuRegistre {
  /** L'identifiant de la fabrication (celui du mouvement de stock de ses lots). */
  id: string;
  article: string;
  libelle: string;
  produit: ProduitAnalyse;
  /** AAAA-MM-JJ */
  date: string;
  /** Du premier au dernier numéro de lot (« PC26295-1 … PC26295-4 »). */
  numeros: string;
  nombreDeLots: number;
  /** Ses analyses, de la plus récente à la plus ancienne. */
  analyses: AnalyseProduit[];
  /** Le jugement de sa dernière analyse. */
  verdict?: Verdict;
}

const plage = (lots: readonly LotFromage[]): string => {
  const numeros = lots.map((l) => l.numero).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return numeros.length === 1 ? numeros[0] : `${numeros[0]} … ${numeros[numeros.length - 1]}`;
};

/**
 * Les fabrications d'un produit (la plus récente d'abord), chacune avec ses analyses : celles qui lui sont rattachées par `fabricationId`. Un lot d'avant le suivi
 * des fabrications (sans mouvement) forme sa fabrication avec ceux du même article et du même jour.
 */
export function fabricationsDuRegistre(
  archive: Pick<ArchiveStock, 'lots' | 'articles' | 'noms' | 'listes'>,
  analyses: readonly AnalyseProduit[] | undefined,
  produit: ProduitAnalyse,
): FabricationDuRegistre[] {
  const groupes = new Map<string, LotFromage[]>();
  for (const lot of archive.lots ?? []) {
    if (produitAnalyseDeLArticle(lot.article) !== produit) continue;
    const cle = lot.mouvementId ?? `${lot.article}@${lot.dateFabrication}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), lot]);
  }
  return [...groupes.entries()]
    .map(([id, lots]) => {
      const liees = (analyses ?? []).filter((a) => a.fabricationId === id).sort((a, b) => b.date.localeCompare(a.date));
      return {
        id,
        article: lots[0].article,
        libelle: libelleArticle(lots[0].article, archive as ArchiveStock),
        produit,
        date: lots[0].dateFabrication,
        numeros: plage(lots),
        nombreDeLots: lots.length,
        analyses: liees,
        verdict: liees[0] ? verdictDeLAnalyse(liees[0]) : undefined,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.numeros.localeCompare(b.numeros));
}

/** Les analyses d'un produit qui ne sont rattachées à aucune fabrication (un prélèvement fait en dehors du suivi des lots). */
export const analysesSansFabrication = (
  analyses: readonly AnalyseProduit[] | undefined,
  produit: ProduitAnalyse,
  fabrications: readonly FabricationDuRegistre[],
): AnalyseProduit[] => {
  const connues = new Set(fabrications.map((f) => f.id));
  return (analyses ?? [])
    .filter((a) => a.produit === produit && (!a.fabricationId || !connues.has(a.fabricationId)))
    .sort((a, b) => b.date.localeCompare(a.date));
};
