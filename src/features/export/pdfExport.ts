import { getSettings, indicatifMarquagePar } from '@/features/settings/settings';
import { especeCourante, especesActives } from '@/shared/dictionnaire/animaux';
import { loadAllYears, loadYear } from '@/shared/storage/localStore';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVisitesVeterinaire } from '@/features/exploitation/repository/visitesVeterinaire';
import { listControles } from '@/features/exploitation/repository/controles';
import { calculerBilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import {
  cartesHtml,
  documentHtml,
  ecrireEtPartagerPdf,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import { controleRow, visiteRow } from '@/features/export/services/lignesExport';
import { detailParCompteHtml } from '@/features/export/services/planComptableHtml';
import { construireRegistreCheptel } from '@/features/export/services/registreCheptel';
import {
  lignesAlimentation,
  lignesRecapCompte,
  lignesParCategorie,
  lignesSyntheseCheptel,
  lignesTerrains,
  tableauxAnalysesLait,
  recapParCompte,
  totauxDeLAnnee,
} from '@/features/export/services/syntheses';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import {
  FORMAT_EXPORT,
  NOM_FICHIER_EXPORT_ANNEE,
  NOM_FICHIER_EXPORT_CHEPTEL,
  NOM_FICHIER_EXPORT_REGISTRE_COMPLET,
  NOM_FICHIER_EXPORT_EXPLOITATION,
  NOM_FICHIER_EXPORT_PLAN_COMPTABLE,
} from '@/shared/constants/export';
import { formatMontant } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const P = TEXTES.export.pdf;

/**
 * Bilan de l'année en PDF : les chiffres clés, le cheptel par statut, les ventes et les factures par catégorie, les visites du
 * vétérinaire et les contrôles. Le détail ligne à ligne (chaque animal, chaque vente, chaque facture) est dans l'export Excel.
 */
export async function exporterAnneePdf(annee: number): Promise<void> {
  const [settings, chevres, ventes, factures, visites, controles] = await Promise.all([
    getSettings(),
    loadYear(CATEGORIE_STOCKAGE.CHEPTEL, annee),
    loadYear(CATEGORIE_STOCKAGE.VENTES, annee),
    loadYear(CATEGORIE_STOCKAGE.FACTURES, annee),
    loadYear(CATEGORIE_STOCKAGE.VISITES_VETERINAIRE, annee),
    loadYear(CATEGORIE_STOCKAGE.CONTROLES, annee),
  ]);

  const indicatif = indicatifMarquagePar(settings.exploitation);
  const terrains = controles.filter((c) => c.famille === FAMILLE_CONTROLE.TERRAIN);
  const analyses = controles.filter((c) => c.famille === FAMILLE_CONTROLE.ANALYSE);
  const autresControles = controles.filter(
    (c) => c.famille !== FAMILLE_CONTROLE.TERRAIN && c.famille !== FAMILLE_CONTROLE.ANALYSE,
  );
  const totaux = totauxDeLAnnee(ventes, factures);
  const coutVisites = visites.reduce((t, v) => t + (v.cout ?? 0), 0);
  const C = P.annee.cartes;
  const corps = [
    cartesHtml([
      {
        libelle: C.recettes,
        valeur: formatMontant(totaux.recettes),
        detail: C.recettesDetail(ventes.length),
      },
      {
        libelle: C.depenses,
        valeur: formatMontant(totaux.depenses),
        detail: C.depensesDetail(totaux.nombreDepenses),
      },
      { libelle: C.resultat, valeur: formatMontant(totaux.recettes - totaux.depenses) },
      { libelle: C.animaux, valeur: String(chevres.length) },
      {
        libelle: C.visites,
        valeur: String(visites.length),
        detail: C.coutVisites(formatMontant(coutVisites)),
      },
      { libelle: C.controles, valeur: String(autresControles.length) },
    ]),
    sectionHtml(
      P.annee.sections.cheptel,
      tableauHtml(lignesSyntheseCheptel(chevres), TEXTES.export.pdfExport.aucunAnimalEnregistrePourCette, {
        totaux: true,
      }),
    ),
    sectionHtml(
      P.annee.sections.ventes,
      tableauHtml(lignesParCategorie(ventes, 'ventes'), TEXTES.export.pdfExport.aucuneVentePourCetteAnnee, {
        totaux: true,
      }),
    ),
    sectionHtml(
      P.annee.sections.recettes,
      tableauHtml(lignesParCategorie(factures, 'emises'), P.annee.aucuneRecette, { totaux: true }),
    ),
    sectionHtml(
      P.annee.sections.depenses,
      tableauHtml(lignesParCategorie(factures, 'recues'), P.annee.aucuneDepense, { totaux: true }),
    ),
    sectionHtml(
      TEXTES.commun.general.visitesVeterinaire,
      tableauHtml(
        visites.map((v) => visiteRow(v, indicatif)),
        TEXTES.commun.general.aucuneVisitePourCetteAnnee,
      ),
    ),
    sectionHtml(
      TEXTES.commun.general.controles,
      tableauHtml(
        autresControles.map((c) => controleRow(c, indicatif)),
        TEXTES.commun.general.aucunControlePourCetteAnnee,
      ),
    ),
    ...tableauxAnalysesLait(analyses).map((lignes, index) =>
      sectionHtml(
        index === 0
          ? TEXTES.exploitation.controles.familles.analyse.titre
          : `${TEXTES.exploitation.controles.familles.analyse.titre} (${index + 1})`,
        tableauHtml(lignes, ''),
      ),
    ),
    ...(terrains.length > 0
      ? [
          sectionHtml(
            TEXTES.exploitation.controles.familles.terrain.titre,
            tableauHtml(lignesTerrains(terrains), '', { totaux: true }),
          ),
        ]
      : []),
    noteHtml(P.annee.detailExcel),
  ].join('');

  const titre = TEXTES.commun.general.exportAnneeTroupeauChevres(annee);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps, especesActives(), undefined, {
      sousTitre: P.annee.sousTitre(annee),
    }),
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

  const indicatif = indicatifMarquagePar(settings.exploitation);
  const terrains = controles.filter((c) => c.famille === FAMILLE_CONTROLE.TERRAIN);
  const analyses = controles.filter((c) => c.famille === FAMILLE_CONTROLE.ANALYSE);
  const autresControles = controles.filter(
    (c) => c.famille !== FAMILLE_CONTROLE.TERRAIN && c.famille !== FAMILLE_CONTROLE.ANALYSE,
  );
  const coutVisites = visites.reduce((t, v) => t + (v.cout ?? 0), 0);
  const C = P.exploitation.cartes;
  const corps = [
    cartesHtml([
      {
        libelle: C.visites,
        valeur: String(visites.length),
        detail: C.coutVisites(formatMontant(coutVisites)),
      },
      { libelle: C.controles, valeur: String(autresControles.length) },
      {
        libelle: C.alimentation,
        valeur: formatMontant(alimentation.total),
        detail: C.kgAchetes(alimentation.totalKg),
      },
      {
        libelle: C.coutParAnimal,
        valeur: alimentation.coutParAnimal !== undefined ? formatMontant(alimentation.coutParAnimal) : '—',
        detail: C.effectif(alimentation.nombreAnimaux),
      },
    ]),
    sectionHtml(
      TEXTES.commun.general.visitesVeterinaire,
      tableauHtml(
        visites.map((v) => visiteRow(v, indicatif)),
        TEXTES.commun.general.aucuneVisitePourCetteAnnee,
      ),
    ),
    sectionHtml(
      TEXTES.commun.general.controles,
      tableauHtml(
        autresControles.map((c) => controleRow(c, indicatif)),
        TEXTES.commun.general.aucunControlePourCetteAnnee,
      ),
    ),
    ...tableauxAnalysesLait(analyses).map((lignes, index) =>
      sectionHtml(
        index === 0
          ? TEXTES.exploitation.controles.familles.analyse.titre
          : `${TEXTES.exploitation.controles.familles.analyse.titre} (${index + 1})`,
        tableauHtml(lignes, ''),
      ),
    ),
    ...(terrains.length > 0
      ? [
          sectionHtml(
            TEXTES.exploitation.controles.familles.terrain.titre,
            tableauHtml(lignesTerrains(terrains), '', { totaux: true }),
          ),
        ]
      : []),
    sectionHtml(
      TEXTES.commun.general.alimentation,
      tableauHtml(lignesAlimentation(alimentation, '—'), TEXTES.export.pdfExport.aucuneDonnee) +
        noteHtml(
          TEXTES.export.pdfExport.effectifEtCoutParAnimal(
            alimentation.nombreAnimaux,
            alimentation.coutParAnimal !== undefined ? formatMontant(alimentation.coutParAnimal) : '—',
          ),
        ),
    ),
  ].join('');

  const titre = TEXTES.commun.general.exploitationAnneeTroupeauChevres(annee);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps, [especeCourante()], undefined, {
      sousTitre: P.annee.sousTitre(annee),
    }),
    `${NOM_FICHIER_EXPORT_EXPLOITATION}_${annee}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}

/**
 * Plan comptable indicatif de l'année en PDF : le récapitulatif par compte avec son total, puis le détail des factures compte par
 * compte (c'est le seul PDF qui compte plusieurs pages : plusieurs écritures pour un même compte).
 */
export async function exporterPlanComptablePdf(annee: number): Promise<void> {
  const [settings, factures] = await Promise.all([getSettings(), listFactures(annee)]);

  const recap = recapParCompte(factures);
  const lignesRecap = lignesRecapCompte(recap, (total) => formatMontant(total));
  const corps = [
    sectionHtml(
      TEXTES.export.pdfExport.recapitulatifParCompte,
      tableauHtml(
        [
          ...lignesRecap,
          ...(lignesRecap.length > 0
            ? [
                {
                  [TEXTES.export.colonnes.nCompte]: '',
                  [TEXTES.export.colonnes.libelle]: P.planComptable.total,
                  [TEXTES.export.colonnes.nombreDeFactures]: recap.reduce((t, r) => t + r.count, 0),
                  [TEXTES.export.colonnes.soldeEur]: formatMontant(recap.reduce((t, r) => t + r.total, 0)),
                },
              ]
            : []),
        ],
        TEXTES.commun.general.aucuneFactureCategoriseePourCette,
        { totaux: true },
      ),
    ),
    sectionHtml(
      TEXTES.export.pdfExport.detailDesFactures,
      detailParCompteHtml(factures, TEXTES.commun.general.aucuneFacturePourCetteAnnee),
    ),
    noteHtml(P.planComptable.avertissement),
  ].join('');

  const titre = TEXTES.commun.general.planComptableAnneeTroupeauChevres(annee);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps, undefined, undefined, {
      sousTitre: P.annee.sousTitre(annee),
    }),
    `${NOM_FICHIER_EXPORT_PLAN_COMPTABLE}_${annee}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}

/**
 * Registre du cheptel en PDF, en paysage : une section par année de désignation (renouvellement si connue, sinon naissance), les
 * unes à la suite des autres. `complet` : tous les animaux avec leur statut ; sinon les seuls animaux vivants et bouclés.
 */
async function exporterRegistrePdf(complet: boolean): Promise<void> {
  const [settings, toutes] = await Promise.all([
    getSettings(),
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then(deEspeceCourante),
  ]);
  const indicatif = indicatifMarquagePar(settings.exploitation);
  const registre = construireRegistreCheptel(toutes, indicatif, { complet });
  const anneesTriees = [...registre.keys()].sort((a, b) => a - b);
  const nombre = [...registre.values()].reduce((t, lignes) => t + lignes.length, 0);
  const note = complet
    ? TEXTES.export.pdfExport.noteRegistreComplet
    : TEXTES.export.pdfExport.noteRegroupementCheptel;

  const corps =
    anneesTriees.length === 0
      ? sectionHtml(
          TEXTES.commun.general.cheptel,
          tableauHtml([], TEXTES.commun.general.aucunAnimalEnregistre),
        )
      : anneesTriees
          .map((annee) =>
            sectionHtml(
              `${TEXTES.commun.general.cheptel} ${annee}`,
              tableauHtml(registre.get(annee) ?? [], TEXTES.commun.general.aucunAnimalPourCetteAnnee),
            ),
          )
          .join('') + noteHtml(note);

  const titre = complet
    ? TEXTES.commun.general.registreCompletTroupeauChevres
    : TEXTES.commun.general.cheptelTroupeauChevres;
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, corps, [especeCourante()], undefined, {
      sousTitre: complet ? P.cheptel.sousTitreComplet(nombre) : P.cheptel.sousTitre(nombre),
    }),
    `${complet ? NOM_FICHIER_EXPORT_REGISTRE_COMPLET : NOM_FICHIER_EXPORT_CHEPTEL}.${FORMAT_EXPORT.PDF}`,
    titre,
    { paysage: true },
  );
}

/** Le registre du cheptel : les animaux vivants et bouclés. */
export const exporterCheptelPdf = (): Promise<void> => exporterRegistrePdf(false);

/** Le registre complet du cheptel : tous les animaux, vivants ou non, bouclés ou non, avec leur statut. */
export const exporterRegistreCompletPdf = (): Promise<void> => exporterRegistrePdf(true);
