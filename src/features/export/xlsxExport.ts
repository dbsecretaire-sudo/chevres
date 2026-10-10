import * as XLSX from 'xlsx';
import { LABEL_CATEGORIE_STOCKAGE } from '@/shared/textes/libelles';
import { CATEGORIES_STOCKAGE } from '@/shared/constants/csv';
import { getYears, loadYear } from '@/shared/storage/localStore';
import { getSettings, indicatifMarquagePar } from '@/features/settings/settings';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { lireArchiveStock } from '@/features/stock/repository';
import { libelleArticle } from '@/features/stock/services/stock';
import { listVisitesVeterinaire } from '@/features/exploitation/repository/visitesVeterinaire';
import { listControles } from '@/features/exploitation/repository/controles';
import { calculerBilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { ecrireEtPartager, feuilleOuMessage } from '@/features/export/services/classeurXlsx';
import {
  type IndicatifParEspece,
  chevreRow,
  controleRow,
  factureRow,
  venteRow,
  visiteRow,
} from '@/features/export/services/lignesExport';
import {
  facturesParCompteEtDate,
  lignesAlimentation,
  lignesRecapCompte,
  recapParCompte,
} from '@/features/export/services/syntheses';
import type { Categorie } from '@/shared/storage/types';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import {
  FORMAT_EXPORT,
  LONGUEUR_MAX_NOM_ONGLET,
  NOM_FICHIER_EXPORT_ANNEE,
  NOM_FICHIER_EXPORT_CHEPTEL,
  NOM_FICHIER_EXPORT_EXPLOITATION,
  NOM_FICHIER_EXPORT_PLAN_COMPTABLE,
} from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

const ROW_BUILDERS: Record<
  Categorie,
  (
    items: any[],
    indicatif?: IndicatifParEspece,
    libelleStock?: (cle: string) => string,
  ) => Record<string, unknown>[]
> = {
  [CATEGORIE_STOCKAGE.CHEPTEL]: (items, indicatif) => items.map((c) => chevreRow(c, indicatif)),
  [CATEGORIE_STOCKAGE.VENTES]: (items) => items.map(venteRow),
  [CATEGORIE_STOCKAGE.FACTURES]: (items, _indicatif, libelleStock) =>
    items.map((f) => factureRow(f, libelleStock)),
  [CATEGORIE_STOCKAGE.VISITES_VETERINAIRE]: (items, indicatif) => items.map((v) => visiteRow(v, indicatif)),
  [CATEGORIE_STOCKAGE.CONTROLES]: (items, indicatif) => items.map((c) => controleRow(c, indicatif, true)),
};

/** Génère un classeur Excel (un onglet par catégorie) pour l'année donnée et ouvre le menu de partage. */
export async function exporterAnneeExcel(annee: number): Promise<void> {
  const [settings, stock] = await Promise.all([getSettings(), lireArchiveStock()]);
  const indicatif = indicatifMarquagePar(settings.exploitation);
  const libelleStock = (cle: string) => libelleArticle(cle, stock);
  const workbook = XLSX.utils.book_new();

  for (const categorie of CATEGORIES_STOCKAGE) {
    const items = await loadYear(categorie, annee);
    XLSX.utils.book_append_sheet(
      workbook,
      feuilleOuMessage(
        ROW_BUILDERS[categorie](items, indicatif, libelleStock),
        TEXTES.export.xlsxExport.aucuneDonneePourCetteAnnee,
      ),
      LABEL_CATEGORIE_STOCKAGE[categorie].slice(0, LONGUEUR_MAX_NOM_ONGLET),
    );
  }

  await ecrireEtPartager(
    workbook,
    `${NOM_FICHIER_EXPORT_ANNEE}_${annee}.${FORMAT_EXPORT.XLSX}`,
    TEXTES.commun.general.exportAnneeTroupeauChevres(annee),
  );
}

/** Rapport Exploitation : vétérinaire + contrôles + alimentation (avec coût par animal) pour l'année donnée. */
export async function exporterExploitationExcel(annee: number): Promise<void> {
  const [settings, visites, controles, alimentation] = await Promise.all([
    getSettings(),
    listVisitesVeterinaire(annee),
    listControles(annee),
    calculerBilanAlimentation(annee),
  ]);
  const indicatif = indicatifMarquagePar(settings.exploitation);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    feuilleOuMessage(
      visites.map((v) => visiteRow(v, indicatif)),
      TEXTES.commun.general.aucuneVisitePourCetteAnnee,
    ),
    TEXTES.export.xlsxExport.veterinaire,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    feuilleOuMessage(
      controles.map((c) => controleRow(c, indicatif, true)),
      TEXTES.commun.general.aucunControlePourCetteAnnee,
    ),
    TEXTES.commun.general.controles,
  );

  const { aliment, montant, quantiteKg, kgParAnimal } = TEXTES.export.colonnes;
  const lignes = [
    ...lignesAlimentation(alimentation, ''),
    { [aliment]: '', [montant]: '', [quantiteKg]: '', [kgParAnimal]: '' },
    {
      [aliment]: TEXTES.export.xlsxExport.effectifChevresBoucsCabris2,
      [montant]: alimentation.nombreAnimaux,
      [quantiteKg]: '',
      [kgParAnimal]: '',
    },
    {
      [aliment]: TEXTES.export.xlsxExport.coutParAnimalHorsAutre,
      [montant]: alimentation.coutParAnimal ?? '',
      [quantiteKg]: '',
      [kgParAnimal]: '',
    },
  ];
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(lignes),
    TEXTES.commun.general.alimentation,
  );

  await ecrireEtPartager(
    workbook,
    `${NOM_FICHIER_EXPORT_EXPLOITATION}_${annee}.${FORMAT_EXPORT.XLSX}`,
    TEXTES.commun.general.exploitationAnneeTroupeauChevres(annee),
  );
}

/**
 * Plan comptable indicatif : regroupe toutes les factures de l'année par compte PCG,
 * avec le total par compte. Correspondance non validée par un expert-comptable — à
 * confirmer avant tout usage officiel.
 */
export async function exporterPlanComptableExcel(annee: number): Promise<void> {
  const [factures, stock] = await Promise.all([listFactures(annee), lireArchiveStock()]);
  const libelleStock = (cle: string) => libelleArticle(cle, stock);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    feuilleOuMessage(
      lignesRecapCompte(recapParCompte(factures), (total) => total),
      TEXTES.commun.general.aucuneFactureCategoriseePourCette,
    ),
    TEXTES.commun.general.planComptable,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    feuilleOuMessage(
      facturesParCompteEtDate(factures).map((f) => factureRow(f, libelleStock)),
      TEXTES.commun.general.aucuneFacturePourCetteAnnee,
    ),
    TEXTES.export.xlsxExport.detailFactures,
  );

  await ecrireEtPartager(
    workbook,
    `${NOM_FICHIER_EXPORT_PLAN_COMPTABLE}_${annee}.${FORMAT_EXPORT.XLSX}`,
    TEXTES.commun.general.planComptableAnneeTroupeauChevres(annee),
  );
}

/** Registre complet du cheptel : un onglet par année (vivantes et historique confondues). */
export async function exporterCheptelExcel(): Promise<void> {
  const [settings, annees] = await Promise.all([getSettings(), getYears(CATEGORIE_STOCKAGE.CHEPTEL)]);
  const indicatif = indicatifMarquagePar(settings.exploitation);
  const workbook = XLSX.utils.book_new();

  const anneesTriees = [...annees].sort((a, b) => a - b);
  if (anneesTriees.length === 0) {
    XLSX.utils.book_append_sheet(
      workbook,
      feuilleOuMessage([], TEXTES.commun.general.aucunAnimalEnregistre),
      TEXTES.commun.general.cheptel,
    );
  } else {
    for (const annee of anneesTriees) {
      const chevres = deEspeceCourante(await loadYear(CATEGORIE_STOCKAGE.CHEPTEL, annee));
      XLSX.utils.book_append_sheet(
        workbook,
        feuilleOuMessage(
          chevres.map((c) => chevreRow(c, indicatif)),
          TEXTES.commun.general.aucunAnimalPourCetteAnnee,
        ),
        String(annee),
      );
    }
  }

  await ecrireEtPartager(
    workbook,
    `${NOM_FICHIER_EXPORT_CHEPTEL}.${FORMAT_EXPORT.XLSX}`,
    TEXTES.commun.general.cheptelTroupeauChevres,
  );
}
