import { verdictDeLAnalyse } from '@/features/analyses/services/analysesProduits';
import { fabricationsDuRegistre, analysesSansFabrication } from '@/features/analyses/services/registreAnalyses';
import { documentHtml, ecrireEtPartagerPdf, noteHtml, sectionHtml, tableauHtml } from '@/features/export/services/htmlPdf';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import { getSettings, type AnalyseProduit, type ProduitAnalyse } from '@/features/settings/settings';
import { lireArchiveStock } from '@/features/stock/repository';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_REGISTRE_ANALYSES } from '@/shared/constants/export';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const P = TEXTES.export.pdf.registreAnalyses;

/** Ce que dit l'analyse en un mot : « Rien à signaler » (conforme), « À signaler » (à surveiller ou non conforme) ou « Non jugé » (aucun repère pour ses résultats). */
export const motDeLAnalyse = (a: Pick<AnalyseProduit, 'produit' | 'resultats'>): string => {
  const verdict = verdictDeLAnalyse(a);
  return verdict === 'conforme' ? P.resultat.rien : verdict ? P.resultat.asignaler : P.resultat.nonJuge;
};

/**
 * Le registre des analyses en PDF, pour un ou plusieurs produits (fromages, charcuterie, plats préparés, savons) : une ligne par analyse (« Analyse du 01/01/2026 :
 * rien à signaler », ou « à signaler »), sans le détail des résultats, puis les fabrications qui n'ont encore aucune analyse. À présenter à un contrôle.
 */
export async function exporterRegistreAnalysesPdf(produits: readonly ProduitAnalyse[]): Promise<void> {
  const [settings, archive, fournisseurs] = await Promise.all([getSettings(), lireArchiveStock(), listFournisseurs()]);
  const analyses = settings.exploitation?.analysesProduits;
  const laboratoires = new Map(fournisseurs.map((f) => [f.id, f.nomEntreprise || f.nom]));
  const aujourdhui = todayISO();

  const sections = produits.map((produit) => {
    const fabrications = fabricationsDuRegistre(archive, analyses, produit);
    const parFabrication = new Map(fabrications.map((f) => [f.id, f]));
    const toutes = [
      ...fabrications.flatMap((f) => f.analyses),
      ...analysesSansFabrication(analyses, produit, fabrications),
    ].sort((a, b) => b.date.localeCompare(a.date));
    const lignes = toutes.map((a) => {
      const fabrication = a.fabricationId ? parFabrication.get(a.fabricationId) : undefined;
      return {
        [P.colonnes.analyse]: P.analyseDu(formatDateFR(a.date)),
        [P.colonnes.produit]: a.echantillon || fabrication?.libelle || '',
        [P.colonnes.lots]: a.lot || fabrication?.numeros || '',
        [P.colonnes.laboratoire]: (a.laboratoireId && laboratoires.get(a.laboratoireId)) || '',
        [P.colonnes.rapport]: a.numeroRapport ?? '',
        [P.colonnes.resultat]: motDeLAnalyse(a),
      };
    });
    const sansAnalyse = fabrications
      .filter((f) => f.analyses.length === 0)
      .map((f) => ({
        [P.colonnes.fabrication]: P.fabriqueLe(formatDateFR(f.date)),
        [P.colonnes.produit]: f.libelle,
        [P.colonnes.lots]: f.numeros,
        [P.colonnes.resultat]: P.resultat.aAnalyser,
      }));
    return sectionHtml(
      TEXTES.analysesProduits.produits[produit].titre,
      tableauHtml(lignes, P.aucuneAnalyse) + (sansAnalyse.length > 0 ? noteHtml(P.sansAnalyse) + tableauHtml(sansAnalyse, '') : ''),
    );
  });

  const titre = produits.length === 1 ? P.titreProduit(TEXTES.analysesProduits.produits[produits[0]].nom) : P.titre;
  const corps = [noteHtml(P.edite(formatDateFR(aujourdhui))), ...sections].join('');
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps, especesActives(), undefined, {}),
    `${NOM_FICHIER_EXPORT_REGISTRE_ANALYSES}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}
