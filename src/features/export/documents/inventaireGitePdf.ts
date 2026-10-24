import { getSettings } from '@/features/settings/settings';
import { consommablesTries, lireArchiveBar, triesSelonOrdre } from '@/features/bar/repository';
import {
  cartesHtml,
  documentHtml,
  ecrireEtPartagerPdf,
  listeTitreHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_INVENTAIRE } from '@/shared/constants/export';
import { COMPTE_PAR_SECTION_INVENTAIRE_GITE } from '@/shared/constants/planComptable';
import { ONGLET_STOCK_BAR } from '@/shared/constants/bar';
import type { ArchiveStock } from '@/features/stock/types';
import { CATEGORIES_GITE, SECTIONS_GITE, categoriesAvecAjoutees } from '@/features/stock/utils/categories';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, niveauxDeStock } from '@/features/stock/services/stock';
import { FILTRE_STOCK_TOUT, GENRE_ARTICLE } from '@/shared/constants/stock';
import { formatDateFR, formatMontant, todayISO } from '@/shared/utils/dates';
import { LABEL_RUBRIQUE_MARCHANDISE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.bar.stock;
const TS = TEXTES.stock;

/** Les catégories de l'inventaire du gîte (celles ajoutées comprises) avec leurs listes d'office (le titre et le compte de chacune). */
const planDe = (ajoutees: ArchiveStock['categories'], reglages: ArchiveStock['reglagesCategories']) =>
  categoriesAvecAjoutees(CATEGORIES_GITE, ajoutees, reglages).map(({ categorie, nom, classe }) => ({
    categorie,
    nom,
    classe,
    listes: SECTIONS_GITE.filter((x) => x.categorie === categorie),
  }));

/**
 * Imprime en PDF l'état de l'inventaire du gîte : par catégorie (37. Marchandises, 32. Autres approvisionnements,
 * 21. Immobilisations), chaque liste avec ses articles, l'activité qu'ils servent et la quantité en stock (et le prix d'une
 * boisson). Le gîte ne garde pas de journal des mouvements : ce sont les quantités du jour.
 */
export async function exporterInventaireGitePdf(): Promise<void> {
  const [settings, archive, inventaire] = await Promise.all([
    getSettings(),
    lireArchiveBar(),
    lireArchiveStock(),
  ]);
  const niveaux = niveauxDeStock(inventaire.mouvements);
  const c = T.exporter.colonnes;
  const activite = (rubrique?: string) =>
    rubrique
      ? LABEL_RUBRIQUE_MARCHANDISE[rubrique as keyof typeof LABEL_RUBRIQUE_MARCHANDISE]
      : T.exporter.toutesActivites;

  const lignesDe = (section: string) =>
    section === ONGLET_STOCK_BAR.CONSOMMABLES
      ? consommablesTries(archive).flatMap((x) => {
          if (x.genre === 'boisson') {
            const b = archive.boissons.find((y) => y.id === x.id);
            return b
              ? [
                  {
                    [c.article]: b.nom,
                    [c.activite]: activite(b.rubrique),
                    [c.quantite]: b.stock ?? 0,
                    [c.prix]: formatMontant(b.prix),
                  },
                ]
              : [];
          }
          const a = archive.aliments.find((y) => y.id === x.id);
          return a
            ? [
                {
                  [c.article]: a.nom,
                  [c.activite]: activite(a.rubrique),
                  [c.quantite]: a.stock,
                  [c.prix]: '',
                },
              ]
            : [];
        })
      : triesSelonOrdre(
          archive.articles.filter((a) => a.categorie === section),
          archive.ordres[section as keyof typeof archive.ordres] ?? [],
        ).map((a) => ({
          [c.article]: a.nom,
          [c.activite]: activite(a.rubrique),
          [c.quantite]: a.stock,
          [c.prix]: '',
        }));

  const nombreArticles =
    archive.articles.length +
    archive.boissons.length +
    archive.aliments.length +
    (inventaire.listes ?? []).length;
  const corps =
    cartesHtml([{ libelle: T.exporter.cartes.articles, valeur: String(nombreArticles) }]) +
    planDe(inventaire.categories, inventaire.reglagesCategories)
      .map(({ categorie, nom, classe, listes }) => {
        const blocs = listes
          .map(({ section, titre }) => {
            const compte = COMPTE_PAR_SECTION_INVENTAIRE_GITE[section];
            return (
              listeTitreHtml(titre, TS.compte(compte.numero, compte.libelle)) +
              tableauHtml(lignesDe(section), T.exporter.aucunArticle)
            );
          })
          .join('');
        // Les listes ajoutées dans la structure des listes : leurs articles et leurs quantités.
        const blocsAjoutes = (inventaire.listes ?? [])
          .filter((l) => l.categorie === categorie)
          .map((l) => {
            const lignes = articlesDuGenre(
              GENRE_ARTICLE.PERSONNALISE,
              inventaire,
              FILTRE_STOCK_TOUT,
              l.id,
            ).map((a) => ({
              [c.article]: a.libelle,
              [c.activite]: T.exporter.toutesActivites,
              [c.quantite]: niveaux.get(a.cle) ?? 0,
              [c.prix]: '',
            }));
            return (
              listeTitreHtml(l.nom, TS.compte(l.compte, l.libelleCompte)) +
              tableauHtml(lignes, T.exporter.aucunArticle)
            );
          })
          .join('');
        return sectionHtml(TS.enteteCategorie(classe, nom), blocs + blocsAjoutes);
      })
      .join('');

  await ecrireEtPartagerPdf(
    documentHtml(T.exporter.titre, settings.exploitation, corps, [], undefined, {
      sousTitre: T.exporter.sousTitre(formatDateFR(todayISO())),
    }),
    `${NOM_FICHIER_EXPORT_INVENTAIRE}_gite.${FORMAT_EXPORT.PDF}`,
    T.exporter.titre,
  );
}
