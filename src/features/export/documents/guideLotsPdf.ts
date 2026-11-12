import { getSettings } from '@/features/settings/settings';
import { cartesHtml, documentHtml, ecrireEtPartagerPdf, noteHtml, sectionHtml } from '@/features/export/services/htmlPdf';
import { lireArchiveStock } from '@/features/stock/repository';
import { numeroDeLot } from '@/features/stock/services/lots';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_GUIDE_LOTS } from '@/shared/constants/export';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';

const P = TEXTES.export.pdf.guideLots;

/**
 * Le guide des numéros de lot en PDF : le prochain numéro qu'un lot prendrait, et les règles. À garder près des étiquettes ou du tampon.
 */
export async function exporterGuideLotsPdf(): Promise<void> {
  const [settings, archive] = await Promise.all([getSettings(), lireArchiveStock()]);

  const cartes = cartesHtml([{ libelle: P.cartes.exemple, valeur: numeroDeLot(archive), detail: P.cartes.exempleDetail }]);

  const corps = [
    sectionHtml(P.sections.lire, cartes),
    sectionHtml(P.sections.regles, P.regles.map((r) => noteHtml(r)).join('')),
  ].join('');

  await ecrireEtPartagerPdf(
    documentHtml(P.titre, settings.exploitation, corps, especesActives(), undefined, {}),
    `${NOM_FICHIER_EXPORT_GUIDE_LOTS}.${FORMAT_EXPORT.PDF}`,
    P.titre,
  );
}
