import { documentHtml, ecrireEtPartagerPdf, tableauHtml } from '@/features/export/services/htmlPdf';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { getSettings } from '@/features/settings/settings';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit, etatDuLot, trierLots } from '@/features/stock/services/lots';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_LISTE_LOTS } from '@/shared/constants/export';
import { ETAT_LOT, PRODUIT_A_LOTS, TRI_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const P = TEXTES.export.pdf.listeLots;

/** Le produit dont on imprime les lots, ou tous. */
export type ProduitDeLaListe = ValeurDe<typeof PRODUIT_A_LOTS> | 'tous';

/**
 * La liste des lots en PDF : un tableau par produit (numéro, article, fabrication, contrôle, état, et pour un lot vendu le client et le prix de la vente), les plus récents
 * d'abord. Tout vient des lots déjà saisis ; c'est le papier à garder près des étiquettes, pour la traçabilité.
 */
export async function exporterListeLotsPdf(produit: ProduitDeLaListe, titreDuProduit: string): Promise<void> {
  const [settings, archive, ventes] = await Promise.all([getSettings(), lireArchiveStock(), listToutesVentes()]);
  const produits = produit === 'tous' ? Object.values(PRODUIT_A_LOTS) : [produit];
  const espece = especeCourante();
  const lignes = produits.flatMap((p) => {
    const articles = articlesDuProduit(p, archive, espece);
    return trierLots(
      (archive.lots ?? []).filter((l) => articles.some((a) => a.cle === l.article)),
      TRI_LOT.NUMERO,
      false,
    ).map((lot) => {
      const etat = etatDuLot(lot);
      const vente = lot.venteId ? ventes.find((v) => v.id === lot.venteId) : undefined;
      return {
        [P.colonnes.lot]: lot.numero,
        [P.colonnes.article]: articles.find((a) => a.cle === lot.article)?.libelle ?? '',
        [P.colonnes.fabrication]: formatDateFR(lot.dateFabrication),
        [P.colonnes.controle]: lot.dateRappel ? P.rappele(formatDateFR(lot.dateRappel)) : lot.controleOk ? P.ok : P.nonOk,
        [P.colonnes.etat]: etat === ETAT_LOT.EN_STOCK ? P.enStock : etat === ETAT_LOT.RAPPELE ? P.rappeleEtat : P.vendu(lot.dateVente ? formatDateFR(lot.dateVente) : ''),
        [P.colonnes.client]: vente?.client ?? '',
        [P.colonnes.prix]: vente?.prix === undefined ? '' : formatMontant(vente.prix),
      };
    });
  });
  const titre = P.titre(titreDuProduit);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, tableauHtml(lignes, P.aucun)),
    `${NOM_FICHIER_EXPORT_LISTE_LOTS}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}
