import { getSettings } from '@/features/settings/settings';
import { loadAllYears, loadYear } from '@/shared/storage/localStore';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVisitesVeterinaire } from '@/features/exploitation/repository/visitesVeterinaire';
import { listControles } from '@/features/exploitation/repository/controles';
import { calculerBilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { documentHtml, ecrireEtPartagerPdf, tableauHtml } from '@/features/export/services/htmlPdf';
import {
  chevreRow,
  controleRow,
  factureRow,
  venteRow,
  visiteRow,
} from '@/features/export/services/lignesExport';
import { construireRegistreCheptel } from '@/features/export/services/registreCheptel';
import { lignesAlimentation, lignesRecapCompte, recapParCompte } from '@/features/export/services/syntheses';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import {
  CLASSE_CSS_SAUT_PAGE,
  FORMAT_EXPORT,
  NOM_FICHIER_EXPORT_ANNEE,
  NOM_FICHIER_EXPORT_CHEPTEL,
  NOM_FICHIER_EXPORT_EXPLOITATION,
  NOM_FICHIER_EXPORT_PLAN_COMPTABLE,
} from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

/** Export complet de l'année (cheptel, ventes, factures, visites, contrôles) en PDF. */
export async function exporterAnneePdf(annee: number): Promise<void> {
  const [settings, chevres, ventes, factures, visites, controles] = await Promise.all([
    getSettings(),
    loadYear(CATEGORIE_STOCKAGE.CHEPTEL, annee),
    loadYear(CATEGORIE_STOCKAGE.VENTES, annee),
    loadYear(CATEGORIE_STOCKAGE.FACTURES, annee),
    loadYear(CATEGORIE_STOCKAGE.VISITES_VETERINAIRE, annee),
    loadYear(CATEGORIE_STOCKAGE.CONTROLES, annee),
  ]);

  const indicatif = settings.exploitation?.indicatifMarquage;
  const corps = `
    <h2>${TEXTES.commun.general.cheptel}</h2>
    ${tableauHtml(
      chevres.map((c) => chevreRow(c, indicatif)),
      TEXTES.export.pdfExport.aucunAnimalEnregistrePourCette,
    )}
    <h2>${TEXTES.export.pdfExport.ventes}</h2>
    ${tableauHtml(ventes.map(venteRow), TEXTES.export.pdfExport.aucuneVentePourCetteAnnee)}
    <h2>${TEXTES.export.pdfExport.factures}</h2>
    ${tableauHtml(factures.map(factureRow), TEXTES.commun.general.aucuneFacturePourCetteAnnee)}
    <h2>${TEXTES.commun.general.visitesVeterinaire}</h2>
    ${tableauHtml(
      visites.map((v) => visiteRow(v, indicatif)),
      TEXTES.commun.general.aucuneVisitePourCetteAnnee,
    )}
    <h2>${TEXTES.commun.general.controles}</h2>
    ${tableauHtml(
      controles.map((c) => controleRow(c, indicatif)),
      TEXTES.commun.general.aucunControlePourCetteAnnee,
    )}
  `;

  const titre = TEXTES.commun.general.exportAnneeTroupeauChevres(annee);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps),
    `${NOM_FICHIER_EXPORT_ANNEE}_${annee}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}

/** Rapport Exploitation (vétérinaire + contrôles + alimentation) en PDF. */
export async function exporterExploitationPdf(annee: number): Promise<void> {
  const [settings, visites, controles, alimentation] = await Promise.all([
    getSettings(),
    listVisitesVeterinaire(annee),
    listControles(annee),
    calculerBilanAlimentation(annee),
  ]);

  const indicatif = settings.exploitation?.indicatifMarquage;
  const coutParAnimal =
    alimentation.coutParAnimal !== undefined ? `${alimentation.coutParAnimal.toFixed(2)} €` : '—';
  const corps = `
    <h2>${TEXTES.commun.general.visitesVeterinaire}</h2>
    ${tableauHtml(
      visites.map((v) => visiteRow(v, indicatif)),
      TEXTES.commun.general.aucuneVisitePourCetteAnnee,
    )}
    <h2>${TEXTES.commun.general.controles}</h2>
    ${tableauHtml(
      controles.map((c) => controleRow(c, indicatif)),
      TEXTES.commun.general.aucunControlePourCetteAnnee,
    )}
    <h2>${TEXTES.commun.general.alimentation}</h2>
    ${tableauHtml(lignesAlimentation(alimentation, '—'), TEXTES.export.pdfExport.aucuneDonnee)}
    <p>${TEXTES.export.pdfExport.effectifEtCoutParAnimal(alimentation.nombreAnimaux, coutParAnimal)}</p>
  `;

  const titre = TEXTES.commun.general.exploitationAnneeTroupeauChevres(annee);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps),
    `${NOM_FICHIER_EXPORT_EXPLOITATION}_${annee}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}

/** Plan comptable indicatif de l'année en PDF (voir avertissement sur l'écran Comptabilité). */
export async function exporterPlanComptablePdf(annee: number): Promise<void> {
  const [settings, factures] = await Promise.all([getSettings(), listFactures(annee)]);

  const lignesRecap = lignesRecapCompte(recapParCompte(factures), (total) => total.toFixed(2));
  const corps = `
    <h2>${TEXTES.export.pdfExport.recapitulatifParCompte}</h2>
    ${tableauHtml(lignesRecap, TEXTES.commun.general.aucuneFactureCategoriseePourCette)}
    <h2>${TEXTES.export.pdfExport.detailDesFactures}</h2>
    ${tableauHtml(factures.map(factureRow), TEXTES.commun.general.aucuneFacturePourCetteAnnee)}
  `;

  const titre = TEXTES.commun.general.planComptableAnneeTroupeauChevres(annee);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps),
    `${NOM_FICHIER_EXPORT_PLAN_COMPTABLE}_${annee}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}

/**
 * Registre complet du cheptel en PDF : une section par année de désignation (renouvellement si
 * connue, sinon naissance), avec saut de page entre chaque. La colonne Descendance indique le nombre
 * total de petits de chaque mère ; les cabris pas encore bouclés n'ont pas de ligne propre (rien à y
 * présenter d'exploitable) mais restent comptés dans cette colonne.
 */
export async function exporterCheptelPdf(): Promise<void> {
  const [settings, toutes] = await Promise.all([getSettings(), loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)]);
  const indicatif = settings.exploitation?.indicatifMarquage;
  const registre = construireRegistreCheptel(toutes, indicatif);
  const anneesTriees = [...registre.keys()].sort((a, b) => a - b);

  const note = `<p class="vide">${TEXTES.export.pdfExport.noteRegroupementCheptel}</p>`;

  let corps: string;
  if (anneesTriees.length === 0) {
    corps = `<h2>${TEXTES.commun.general.cheptel}</h2>${note}${tableauHtml([], TEXTES.commun.general.aucunAnimalEnregistre)}`;
  } else {
    corps = anneesTriees
      .map((annee, index) => {
        const classe = index > 0 ? ` ${CLASSE_CSS_SAUT_PAGE}` : '';
        return `<div class="${classe}"><h2>${TEXTES.commun.general.cheptel} ${annee}</h2>${index === 0 ? note : ''}${tableauHtml(
          registre.get(annee) ?? [],
          TEXTES.commun.general.aucunAnimalPourCetteAnnee,
        )}</div>`;
      })
      .join('');
  }

  const titre = TEXTES.commun.general.cheptelTroupeauChevres;
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps),
    `${NOM_FICHIER_EXPORT_CHEPTEL}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}
