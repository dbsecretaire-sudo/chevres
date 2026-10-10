import { getSettings } from '@/features/settings/settings';
import type { ListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import { documentHtml, ecrireEtPartagerPdf, noteHtml, tableauHtml } from '@/features/export/services/htmlPdf';
import { ARTICLE_BOUCLE, SORTE_BOUCLES_TOUTES } from '@/shared/constants/stock';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_BOUCLES } from '@/shared/constants/export';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { formatDateShortFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles;
const P = TEXTES.export.pdf.boucles;

/**
 * Imprime en PDF les boucles telles que l'écran les montre : les filtres appliqués (la sorte et l'état) et le tri choisi, avec
 * leurs libellés en sous-titre pour savoir ce que la liste contient.
 */
export async function exporterBouclesPdf(liste: ListeBoucles): Promise<void> {
  const settings = await getSettings();
  const libelleSorte =
    liste.sorte === SORTE_BOUCLES_TOUTES
      ? T.sorte.tout
      : liste.sorte.endsWith(`:${ARTICLE_BOUCLE.ROUGES}`)
        ? T.sorte.rouges
        : T.sorte.boucles;
  const lignes = liste.lignes.map((b) => ({
    [T.colonnes.numero]: b.numero,
    [P.sorte]: b.article.endsWith(`:${ARTICLE_BOUCLE.ROUGES}`) ? T.sorte.rouges : T.sorte.boucles,
    [T.colonnes.pose]: b.datePose ? formatDateShortFR(b.datePose) : b.chevreId ? T.posee : '',
    [T.colonnes.achat]: b.dateAchat ? formatDateShortFR(b.dateAchat) : '',
    [T.morte]: b.chevreId && liste.morts.has(b.chevreId) ? P.oui : '',
  }));
  const corps = [tableauHtml(lignes, T.aucuneBoucle), noteHtml(P.total(lignes.length))].join('');
  await ecrireEtPartagerPdf(
    documentHtml(P.titre, settings.exploitation, corps, especesActives(), undefined, {
      sousTitre: P.filtres(libelleSorte, T.etat[liste.etat]),
    }),
    `${NOM_FICHIER_EXPORT_BOUCLES}.${FORMAT_EXPORT.PDF}`,
    P.titre,
  );
}
