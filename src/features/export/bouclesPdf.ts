import { getSettings } from '@/features/settings/settings';
import {
  estArticleRebouclage,
  estBoucleDeRemplacement,
  libelleDeLaSorte,
  nePasPoser,
  texteDeLaRemarque,
} from '@/features/stock/services/boucles';
import type { ListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import {
  documentHtml,
  ecrireEtPartagerPdf,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_BOUCLES } from '@/shared/constants/export';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { formatDateShortFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles;
const P = TEXTES.export.pdf.boucles;

export async function exporterBouclesPdf(listes: ListeBoucles[]): Promise<void> {
  const settings = await getSettings();
  const corps = listes
    .map((liste) => {
      const rouge = estBoucleDeRemplacement(liste.article);
      const rebouclage = estArticleRebouclage(liste.article);
      const avecRemarques = liste.lignes.some((b) => b.remarque);
      const lignes = liste.lignes.map((b) => ({
        [rouge ? T.numeroRemplacement : T.colonnes.numero]: b.numero,
        [rebouclage ? T.poseRebouclage : rouge ? T.poseRouge : T.colonnes.pose]: b.datePose
          ? formatDateShortFR(b.datePose)
          : b.chevreId
            ? T.posee
            : nePasPoser(b)
              ? T.nePasPoser
              : '',
        ...(rouge ? {} : { [T.colonnes.achat]: b.dateAchat ? formatDateShortFR(b.dateAchat) : '' }),
        [T.morte]: b.chevreId && liste.morts.has(b.chevreId) ? P.oui : '',
        ...(avecRemarques ? { [T.colonnes.remarque]: b.remarque ? texteDeLaRemarque(b.remarque) : '' } : {}),
      }));
      return sectionHtml(
        libelleDeLaSorte(liste.article),
        [
          noteHtml(P.filtres(T.etat[liste.etat])),
          tableauHtml(lignes, T.aucuneBoucle),
          noteHtml(P.total(lignes.length)),
        ].join(''),
      );
    })
    .join('');
  await ecrireEtPartagerPdf(
    documentHtml(P.titre, settings.exploitation, corps, especesActives(), undefined, {}),
    `${NOM_FICHIER_EXPORT_BOUCLES}.${FORMAT_EXPORT.PDF}`,
    P.titre,
  );
}
