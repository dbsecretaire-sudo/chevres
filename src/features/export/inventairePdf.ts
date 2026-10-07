import { getSettings } from '@/features/settings/settings';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { lireArchiveStock } from '@/features/stock/repository';
import { libelleArticle, libelleOrigineMouvement, roleDeLaViande } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, MouvementStock } from '@/features/stock/types';
import { documentHtml, echapper, ecrireEtPartagerPdf, tableauHtml } from '@/features/export/services/htmlPdf';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_INVENTAIRE } from '@/shared/constants/export';
import {
  CATEGORIE_INVENTAIRE,
  CATEGORIE_PAR_GENRE,
  CLASSE_INVENTAIRE,
  GENRE_ARTICLE,
} from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/** Les catégories de l'inventaire, dans l'ordre de l'organisation comptable : leur nom. */
const CATEGORIES: { categorie: ValeurDe<typeof CATEGORIE_INVENTAIRE>; nom: string }[] = [
  { categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS, nom: T.categories.produitsFinis },
  { categorie: CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX, nom: T.categories.produitsAnimaux },
  { categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES, nom: T.categories.matieresPremieres },
  { categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS, nom: T.categories.autresApprovisionnements },
  { categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS, nom: T.categories.immobilisations },
];

/**
 * La catégorie d'un mouvement : celle de son genre d'article (les lignes d'animaux de la viande sont des produits animaux, et
 * un article d'une liste ajoutée suit la catégorie de sa liste).
 */
const categorieDuMouvement = (
  m: MouvementStock,
  archive: ArchiveStock,
): ValeurDe<typeof CATEGORIE_INVENTAIRE> => {
  const genre = m.article.split(':')[0] as GenreArticle;
  if (genre === GENRE_ARTICLE.PERSONNALISE) {
    const article = archive.articles.find((a) => a.id === m.article.split(':')[1]);
    return archive.listes?.find((l) => l.id === article?.listeId)?.categorie ?? CATEGORIE_PAR_GENRE[genre];
  }
  return roleDeLaViande(m.article) ? CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX : CATEGORIE_PAR_GENRE[genre];
};

const signe = (nombre: number): string => `${nombre > 0 ? '+' : ''}${String(nombre).replace('.', ',')}`;

/**
 * Imprime en PDF tous les mouvements de l'inventaire, rangés par catégorie de l'organisation comptable (35. Produits finis,
 * 31. Matières premières…), du plus ancien au plus récent, avec le journal de lait et les ventes de lait.
 */
export async function exporterInventairePdf(): Promise<void> {
  const [settings, archive, ventes] = await Promise.all([
    getSettings(),
    lireArchiveStock(),
    listToutesVentes(),
  ]);
  const colonnes = T.exporter.colonnes;
  const parDate = <C extends { date: string }>(liste: C[]) =>
    [...liste].sort((a, b) => a.date.localeCompare(b.date));

  const blocs = CATEGORIES.map(({ categorie, nom }) => {
    const lignes = parDate(
      archive.mouvements.filter((m) => categorieDuMouvement(m, archive) === categorie),
    ).map((m) => ({
      [colonnes.date]: formatDateFR(m.date),
      [colonnes.article]: libelleArticle(m.article, archive),
      [colonnes.mouvement]: signe(m.delta),
      [colonnes.origine]: libelleOrigineMouvement(m),
    }));
    return `<h2>${echapper(T.enteteCategorie(CLASSE_INVENTAIRE[categorie], nom))}</h2>${tableauHtml(lignes, T.exporter.aucunMouvement)}`;
  });

  // Le lait n'est pas un article : le litrage de chaque jour, le lait versé dans un fromage et les ventes de lait.
  const lait = parDate([
    ...archive.lait.map((l) => ({ date: l.date, litres: l.litres, origine: T.exporter.production })),
    ...archive.mouvements
      .filter((m) => m.litres && m.delta > 0)
      .map((m) => ({ date: m.date, litres: -(m.litres ?? 0), origine: T.exporter.fabrication })),
    ...ventes
      .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT && v.quantite)
      .map((v) => ({ date: v.date, litres: -v.quantite, origine: T.vente })),
  ]).map((l) => ({
    [colonnes.date]: formatDateFR(l.date),
    [colonnes.litres]: signe(l.litres),
    [colonnes.origine]: l.origine,
  }));
  blocs.splice(1, 0, `<h2>${echapper(T.exporter.lait)}</h2>${tableauHtml(lait, T.exporter.aucunLait)}`);

  await ecrireEtPartagerPdf(
    documentHtml(T.exporter.titre, settings.exploitation, blocs.join(''), especesActives()),
    `${NOM_FICHIER_EXPORT_INVENTAIRE}.${FORMAT_EXPORT.PDF}`,
    T.exporter.titre,
  );
}
