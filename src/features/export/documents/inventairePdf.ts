import { getSettings } from '@/features/settings/settings';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { lireArchiveStock } from '@/features/stock/repository';
import { cleArticle, libelleArticle, roleDeLaViande } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, MouvementStock } from '@/features/stock/types';
import { CATEGORIES, categoriesAvecAjoutees } from '@/features/stock/utils/categories';
import {
  cartesHtml,
  documentHtml,
  ecrireEtPartagerPdf,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_INVENTAIRE } from '@/shared/constants/export';
import { CATEGORIE_INVENTAIRE, CATEGORIE_PAR_GENRE, GENRE_ARTICLE } from '@/shared/constants/stock';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;
const P = TEXTES.export.pdf.inventaire;

/**
 * La catégorie d'un mouvement : celle de son genre d'article (les lignes d'animaux de la viande sont des produits animaux, et
 * un article d'une liste ajoutée suit la catégorie de sa liste).
 */
const categorieDuMouvement = (m: MouvementStock, archive: ArchiveStock): string => {
  const genre = m.article.split(':')[0] as GenreArticle;
  if (genre === GENRE_ARTICLE.PERSONNALISE) {
    const article = archive.articles.find((a) => a.id === m.article.split(':')[1]);
    return archive.listes?.find((l) => l.id === article?.listeId)?.categorie ?? CATEGORIE_PAR_GENRE[genre];
  }
  return roleDeLaViande(m.article) ? CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX : CATEGORIE_PAR_GENRE[genre];
};

const nombre = (valeur: number): string => String(Math.round(valeur * 100) / 100).replace('.', ',');
const signe = (valeur: number): string =>
  valeur === 0 ? '0' : `${valeur > 0 ? '+' : '−'}${nombre(Math.abs(valeur))}`;

/**
 * Imprime en PDF l'état de l'inventaire : par catégorie de l'organisation comptable (35. Produits finis, 31. Matières premières…),
 * chaque article avec son stock actuel et ses entrées et sorties de l'année choisie ; puis le lait, mois par mois. Le journal
 * détaillé des mouvements se consulte dans l'historique de l'application.
 */
export async function exporterInventairePdf(annee: number): Promise<void> {
  const [settings, archive, ventes] = await Promise.all([
    getSettings(),
    lireArchiveStock(),
    listToutesVentes(),
  ]);
  const colonnes = T.exporter.colonnes;
  const debut = `${annee}-01-01`;
  const fin = `${annee}-12-31`;
  const delAnnee = (m: { date: string }) => m.date >= debut && m.date <= fin;

  // Chaque article : son stock (tous les mouvements) et ses entrées et sorties de l'année ; ceux d'une liste ajoutée y figurent même sans mouvement.
  const articles = new Map<string, { categorie: string; stock: number; entrees: number; sorties: number }>();
  const suivre = (cle: string, categorie: string) => {
    if (!articles.has(cle)) articles.set(cle, { categorie, stock: 0, entrees: 0, sorties: 0 });
    return articles.get(cle)!;
  };
  for (const a of archive.articles) {
    if (a.genre !== GENRE_ARTICLE.PERSONNALISE) continue;
    const categorie =
      archive.listes?.find((l) => l.id === a.listeId)?.categorie ?? CATEGORIE_PAR_GENRE[a.genre];
    suivre(cleArticle(a.genre, a.id), categorie);
  }
  for (const m of archive.mouvements) {
    const article = suivre(m.article, categorieDuMouvement(m, archive));
    article.stock += m.delta;
    if (delAnnee(m)) {
      if (m.delta > 0) article.entrees += m.delta;
      else article.sorties += m.delta;
    }
  }
  const nombreMouvements = archive.mouvements.filter(delAnnee).length;

  const categories = categoriesAvecAjoutees(CATEGORIES, archive.categories, archive.reglagesCategories);
  const blocs = categories.map(({ categorie, nom, classe }) => {
    const lignes = [...articles.entries()]
      .filter(([, a]) => a.categorie === categorie)
      .map(([cle, a]) => ({ libelle: libelleArticle(cle, archive), ...a }))
      .sort((x, y) => x.libelle.localeCompare(y.libelle))
      .map((a) => ({
        [colonnes.article]: a.libelle,
        [P.colonnes.stock]: nombre(a.stock),
        [P.colonnes.entrees(annee)]: a.entrees === 0 ? '—' : signe(a.entrees),
        [P.colonnes.sorties(annee)]: a.sorties === 0 ? '—' : signe(a.sorties),
      }));
    return sectionHtml(T.enteteCategorie(classe, nom), tableauHtml(lignes, T.exporter.aucunMouvement));
  });

  // Le lait n'est pas un article : le litrage produit, le lait versé dans un fromage et les ventes de lait, mois par mois.
  const parMois = new Map<number, { produit: number; fabrique: number; vendu: number }>();
  const mois = (date: string) => {
    const m = Number(date.slice(5, 7));
    if (!parMois.has(m)) parMois.set(m, { produit: 0, fabrique: 0, vendu: 0 });
    return parMois.get(m)!;
  };
  for (const l of archive.lait.filter(delAnnee)) mois(l.date).produit += l.litres;
  for (const m of archive.mouvements.filter((x) => delAnnee(x) && x.litres && x.delta > 0)) {
    mois(m.date).fabrique += m.litres ?? 0;
  }
  for (const v of ventes.filter((x) => delAnnee(x) && x.categorie === CATEGORIE_VENTE.LAIT && x.quantite)) {
    mois(v.date).vendu += v.quantite;
  }
  const lignesLait: Record<string, string>[] = [...parMois.entries()]
    .sort(([a], [b]) => a - b)
    .map(([m, l]) => ({
      [P.lait.mois]: NOMS_MOIS[m - 1],
      [P.lait.produit]: nombre(l.produit),
      [P.lait.fabrique]: nombre(l.fabrique),
      [P.lait.vendu]: nombre(l.vendu),
    }));
  if (lignesLait.length > 0) {
    const somme = (cle: 'produit' | 'fabrique' | 'vendu') =>
      [...parMois.values()].reduce((t, l) => t + l[cle], 0);
    lignesLait.push({
      [P.lait.mois]: TEXTES.export.pdf.planComptable.total,
      [P.lait.produit]: nombre(somme('produit')),
      [P.lait.fabrique]: nombre(somme('fabrique')),
      [P.lait.vendu]: nombre(somme('vendu')),
    });
  }
  blocs.splice(
    1,
    0,
    sectionHtml(T.exporter.lait, tableauHtml(lignesLait, T.exporter.aucunLait, { totaux: true })),
  );

  const corps = [
    cartesHtml([
      { libelle: P.cartes.articles, valeur: String(articles.size) },
      { libelle: P.cartes.mouvements(annee), valeur: String(nombreMouvements) },
    ]),
    ...blocs,
    noteHtml(P.note),
  ].join('');

  await ecrireEtPartagerPdf(
    documentHtml(T.exporter.titre, settings.exploitation, corps, especesActives(), undefined, {
      sousTitre: TEXTES.export.pdf.annee.sousTitre(annee),
    }),
    `${NOM_FICHIER_EXPORT_INVENTAIRE}.${FORMAT_EXPORT.PDF}`,
    T.exporter.titre,
  );
}
