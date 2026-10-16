import { getSettings } from '@/features/settings/settings';
import {
  cartesHtml,
  documentHtml,
  ecrireEtPartagerPdf,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  articlesDuProduit,
  estArticleFromage,
  jourDeLAnnee,
  lettreDeCategorie,
  numeroDeLot,
  prefixeDeLot,
} from '@/features/stock/services/lots';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_GUIDE_LOTS } from '@/shared/constants/export';
import { LETTRE_PRODUIT_LOT, PRODUIT_A_LOTS, SEPARATEUR_NUMERO_LOT } from '@/shared/constants/stock';
import { especesActives, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const P = TEXTES.export.pdf.guideLots;

/**
 * Le guide des numéros de lot en PDF : comment se lit « FF261-1 », les lettres de chaque produit de l'inventaire, et le numéro que
 * chacun prendrait aujourd'hui. À garder près des étiquettes ou du tampon.
 */
export async function exporterGuideLotsPdf(espece: EspeceAnimale): Promise<void> {
  const [settings, archive] = await Promise.all([getSettings(), lireArchiveStock()]);
  const aujourdhui = todayISO();
  const annee = aujourdhui.slice(2, 4);
  const jour = jourDeLAnnee(aujourdhui);
  const produits = [
    ...articlesDuProduit(PRODUIT_A_LOTS.FROMAGE, archive, espece),
    ...articlesDuProduit(PRODUIT_A_LOTS.CHARCUTERIE, archive, espece),
  ];
  const exemple = produits[0]
    ? numeroDeLot(archive, produits[0].cle, aujourdhui)
    : `FF${annee}${jour}${SEPARATEUR_NUMERO_LOT}1`;

  const cartes = cartesHtml([
    { libelle: P.cartes.exemple, valeur: exemple, detail: P.cartes.exempleDetail(formatDateFR(aujourdhui)) },
    { libelle: P.cartes.jour, valeur: String(jour), detail: P.cartes.jourDetail },
  ]);

  const composition = tableauHtml(
    [
      { [P.colonnes.partie]: P.partie.produit, [P.colonnes.exemple]: 'F', [P.colonnes.sens]: P.sens.produit },
      {
        [P.colonnes.partie]: P.partie.categorie,
        [P.colonnes.exemple]: 'F',
        [P.colonnes.sens]: P.sens.categorie,
      },
      { [P.colonnes.partie]: P.partie.annee, [P.colonnes.exemple]: annee, [P.colonnes.sens]: P.sens.annee },
      {
        [P.colonnes.partie]: P.partie.jour,
        [P.colonnes.exemple]: String(jour),
        [P.colonnes.sens]: P.sens.jour,
      },
      {
        [P.colonnes.partie]: P.partie.numero,
        [P.colonnes.exemple]: `${SEPARATEUR_NUMERO_LOT}1`,
        [P.colonnes.sens]: P.sens.numero,
      },
    ],
    '',
  );

  const lettres = tableauHtml(
    produits.map((a) => ({
      [P.colonnes.produit]: a.libelle,
      [P.colonnes.lettreProduit]:
        LETTRE_PRODUIT_LOT[estArticleFromage(a.cle) ? PRODUIT_A_LOTS.FROMAGE : PRODUIT_A_LOTS.CHARCUTERIE],
      [P.colonnes.lettreCategorie]: lettreDeCategorie(a.cle, archive),
      [P.colonnes.debut]: prefixeDeLot(a.cle, aujourdhui, archive),
      [P.colonnes.premier]: numeroDeLot(archive, a.cle, aujourdhui),
    })),
    P.aucunProduit,
  );

  const corps = [
    sectionHtml(P.sections.lire, cartes + composition),
    sectionHtml(P.sections.produits, [lettres, noteHtml(P.noteProduits(formatDateFR(aujourdhui)))].join('')),
    sectionHtml(P.sections.regles, P.regles.map((r) => noteHtml(r)).join('')),
  ].join('');

  await ecrireEtPartagerPdf(
    documentHtml(P.titre, settings.exploitation, corps, especesActives(), undefined, {}),
    `${NOM_FICHIER_EXPORT_GUIDE_LOTS}.${FORMAT_EXPORT.PDF}`,
    P.titre,
  );
}
