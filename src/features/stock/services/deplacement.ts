import { lireArchiveCommercial, remplacerArchiveCommercial } from '@/features/commercial/repository';
import { listToutesFactures, remplacerFacture } from '@/features/comptabilite/repository/factures';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import { cleArticle, libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { generateId } from '@/shared/utils/id';

/** Où range-t-on l'article : un genre d'article (aliments, matériel, bâtiments, entretien…), ou une liste ajoutée (genre « personnalisé » et son identifiant). */
export interface CibleDeplacement {
  genre: GenreArticle;
  listeId?: string;
}

/** Les genres dont les articles peuvent changer de compte : ceux des fournitures et des immobilisations (pas les produits vendus, ni les boucles ni les emballages, liés au conditionnement). */
export const GENRES_DEPLACABLES: readonly GenreArticle[] = [
  GENRE_ARTICLE.ALIMENT,
  GENRE_ARTICLE.ENTRETIEN,
  GENRE_ARTICLE.EQUIPEMENT,
  GENRE_ARTICLE.MATERIEL,
  GENRE_ARTICLE.BATIMENT,
  GENRE_ARTICLE.PERSONNALISE,
];

/** Les produits vendus : un fromage, une viande, un plat, un savon. */
const GENRES_DE_PRODUITS: readonly GenreArticle[] = [
  GENRE_ARTICLE.FROMAGE,
  GENRE_ARTICLE.VIANDE,
  GENRE_ARTICLE.PLAT,
  GENRE_ARTICLE.SAVON,
];

/**
 * Vrai quand l'article peut changer de compte. Les fournitures, le matériel et les bâtiments, oui, d'office ou ajoutés. Un produit vendu (produits finis, produits
 * animaux) ou un emballage, seulement s'il a été ajouté, qu'il n'a ni lot ni conditionnement qui s'y rattachent : un produit d'office (les types de fromage, les lignes
 * des animaux, les emballages de départ) tient à sa nature, les ventes et le cheptel le reconnaissent. Jamais une boucle.
 */
export function peutChangerDeCompte(archive: Pick<ArchiveStock, 'articles' | 'lots' | 'conditionnements' | 'conditionnementsParAnnee'>, cle: string): boolean {
  const [genre, code] = cle.split(':') as [GenreArticle, string];
  if (GENRES_DEPLACABLES.includes(genre)) return true;
  const ajoute = archive.articles.some((a) => a.genre === genre && a.id === code);
  if (!ajoute) return false;
  if (GENRES_DE_PRODUITS.includes(genre)) return !(archive.lots ?? []).some((l) => l.article === cle);
  if (genre === GENRE_ARTICLE.EMBALLAGE) {
    const dansUnConditionnement = (parCode: Record<string, string[]>) =>
      Object.values(parCode).some((emballages) => emballages.includes(code));
    return (
      !dansUnConditionnement(archive.conditionnements) &&
      !Object.values(archive.conditionnementsParAnnee ?? {}).some(dansUnConditionnement)
    );
  }
  return false;
}

/** Une copie de la valeur où l'identifiant d'article `ancienne` est remplacé par `nouvelle`, partout : dans les textes comme dans les noms de propriétés. */
export function remplacerCle<T>(valeur: T, ancienne: string, nouvelle: string): T {
  if (typeof valeur === 'string') return (valeur === ancienne ? nouvelle : valeur) as T;
  if (Array.isArray(valeur)) return valeur.map((v) => remplacerCle(v, ancienne, nouvelle)) as T;
  if (valeur && typeof valeur === 'object') {
    return Object.fromEntries(
      Object.entries(valeur).map(([cle, v]) => [cle === ancienne ? nouvelle : cle, remplacerCle(v, ancienne, nouvelle)]),
    ) as T;
  }
  return valeur;
}

/**
 * Change l'article de compte (de l'immobilisation à la matière première, d'une liste à une autre) : il passe dans le genre ou la liste choisis, avec son nom, ses
 * mouvements, son prix et son historique. Son identifiant change quand son genre change : il est remplacé partout où il est cité (le stock, le commercial et les factures
 * d'achat), pour que rien ne se perde. Rend le nouvel identifiant.
 */
export async function deplacerArticle(cle: string, cible: CibleDeplacement): Promise<string> {
  const archive = await lireArchiveStock();
  const [genre, code] = cle.split(':') as [GenreArticle, string];
  const existant = archive.articles.find((a) => a.genre === genre && a.id === code);
  const listeId = cible.genre === GENRE_ARTICLE.PERSONNALISE ? cible.listeId : undefined;
  const nom = existant?.nom ?? libelleArticle(cle, archive);
  // Un article d'office (sans fiche) en reçoit une : il garde son nom, et l'ancien est masqué.
  const id = existant?.id ?? generateId();
  const nouvelleCle = cleArticle(cible.genre, id);

  if (nouvelleCle === cle) {
    await remplacerArchiveStock({
      ...archive,
      articles: archive.articles.map((a) => (a.id === id ? { ...a, listeId } : a)),
    });
    return cle;
  }

  const refait = remplacerCle(archive, cle, nouvelleCle);
  const ordres = { ...refait.ordres, [genre]: (refait.ordres[genre] ?? []).filter((c) => c !== nouvelleCle) };
  await remplacerArchiveStock({
    ...refait,
    ordres,
    articles: [
      ...refait.articles.filter((a) => a.id !== id),
      { id, genre: cible.genre, nom, activite: existant?.activite, listeId },
    ],
    masques: existant ? refait.masques : [...new Set([...(refait.masques ?? []), cle])],
  });
  await remplacerArchiveCommercial(remplacerCle(await lireArchiveCommercial(), cle, nouvelleCle));
  for (const facture of await listToutesFactures()) {
    if (JSON.stringify(facture).includes(cle)) await remplacerFacture(remplacerCle(facture, cle, nouvelleCle));
  }
  return nouvelleCle;
}
