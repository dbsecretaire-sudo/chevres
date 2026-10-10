import * as XLSX from 'xlsx';
import { getSettings, type InfosEntreprise } from '@/features/settings/settings';
import { listClients } from '@/features/clients/repository';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import { calculerFiscaliteEntreprise } from '@/features/entreprise/services/fiscaliteEntreprise';
import { calculerUrssaf } from '@/features/entreprise/services/urssaf';
import { lireArchiveGite } from '@/features/gite/repository';
import { listTrades } from '@/features/trading/repository';
import { ecrireEtPartager, feuilleOuMessage } from '@/features/export/services/classeurXlsx';
import {
  cartesHtml,
  documentHtml,
  echapper,
  ecrireEtPartagerPdf,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import {
  lignesFacturesPdf,
  lignesSejoursPdf,
  lignesTradesPdf,
} from '@/features/export/services/lignesEntreprisePdf';
import type { Facture } from '@/features/comptabilite/types';
import type { Element } from '@/features/dossiers/types';
import type { Sejour } from '@/features/gite/types';
import type { Trade } from '@/features/trading/types';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { formatMontant } from '@/shared/utils/dates';
import {
  clientRow,
  elementRow,
  factureEntrepriseRow,
  lignesSynthese,
  lignesUrssaf,
  sejourRow,
  tradeRow,
} from '@/features/export/services/lignesEntreprise';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_ENTREPRISE } from '@/shared/constants/export';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { LABEL_REGIME_FISCAL, LABEL_STATUT_JURIDIQUE } from '@/shared/textes/libelles';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';

type Ligne = Record<string, unknown>;

interface DonneesEntreprise {
  /** Ce dont le PDF a besoin : les chiffres de l'année et les listes sources (le PDF les résume, l'Excel les détaille). */
  brut: {
    fiscalite: Awaited<ReturnType<typeof calculerFiscaliteEntreprise>>;
    factures: Facture[];
    avecTva: boolean;
    nombreClients: number;
    contenus: Element[];
    sejours?: Sejour[];
    trades?: Trade[];
  };
  titre: string;
  entreprise: InfosEntreprise | undefined;
  /** Les onglets / sections du rapport, dans l'ordre : nom, lignes et message quand il n'y en a pas. */
  sections: { nom: string; lignes: Ligne[]; vide: string }[];
}

/** Tout ce qui figure dans l'export de l'année : synthèse, factures, clients, contenus des dossiers, séjours du gîte. */
async function rassemblerDonnees(annee: number): Promise<DonneesEntreprise> {
  const T = TEXTES.export.entreprise;
  const [settings, fiscalite, factures, clients, dossiers] = await Promise.all([
    getSettings(),
    calculerFiscaliteEntreprise(annee),
    listFactures(annee),
    listClients(),
    lireArchiveDossiers(),
  ]);
  const entreprise = settings.exploitation?.entreprise;
  const avecTva = !!entreprise?.tvaApplicable;
  const delAnnee = (date?: string) => !!date && date.startsWith(String(annee));

  const contenusDeLAnnee = dossiers.elements.filter((e) => delAnnee(e.date) || delAnnee(e.echeance));
  const brut: DonneesEntreprise['brut'] = {
    fiscalite,
    factures,
    avecTva,
    nombreClients: clients.length,
    contenus: contenusDeLAnnee,
  };

  const sections: DonneesEntreprise['sections'] = [
    { nom: T.synthese, lignes: lignesSynthese(fiscalite, avecTva), vide: T.aucuneFacture },
    {
      nom: T.factures,
      lignes: factures.map((f) => factureEntrepriseRow(f, avecTva)),
      vide: T.aucuneFacture,
    },
    {
      nom: T.urssaf,
      lignes: lignesUrssaf(await calculerUrssaf(annee, entreprise)),
      vide: T.aucunUrssaf,
    },
    { nom: T.clients, lignes: clients.map(clientRow), vide: T.aucunClient },
    {
      nom: T.contenus,
      lignes: contenusDeLAnnee.map((e) => elementRow(e, clients, dossiers.sousDossiers)),
      vide: T.aucunContenu,
    },
  ];

  if (activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION)) {
    const gite = await lireArchiveGite();
    brut.sejours = gite.sejours
      .filter((s) => delAnnee(s.arrivee))
      .sort((a, b) => a.arrivee.localeCompare(b.arrivee));
    sections.push({
      nom: T.sejours,
      lignes: brut.sejours.map(sejourRow),
      vide: T.aucunSejour,
    });
  }

  if (activitesEtablissement().includes(ACTIVITE_SOCIETE.LIBERAL)) {
    const trades = await listTrades();
    brut.trades = trades
      .filter((t) => delAnnee(t.dateEntree))
      .sort((a, b) => a.dateEntree.localeCompare(b.dateEntree));
    sections.push({
      nom: TEXTES.trading.export.section,
      lignes: brut.trades.map(tradeRow),
      vide: TEXTES.trading.export.aucun,
    });
  }

  const nom = entreprise?.nomEntreprise?.trim() || T.nomParDefaut;
  return { titre: T.titreExport(annee, nom), entreprise, sections, brut };
}

/** L'en-tête du rapport : nom du dirigeant, adresse, puis SIRET, APE, TVA, statut et régime fiscal renseignés. */
function enTeteEntrepriseHtml(entreprise: InfosEntreprise | undefined): string {
  if (!entreprise) return '';
  const E = TEXTES.export.entreprise.entete;
  const identite = [entreprise.dirigeant, entreprise.adresse].filter(Boolean).map(echapper);
  const champs: [string, string | undefined][] = [
    [E.siret, entreprise.siret],
    [E.codeApe, entreprise.codeApe],
    [E.numeroTva, entreprise.tvaApplicable ? entreprise.numeroTva : undefined],
    [E.statut, entreprise.statut ? LABEL_STATUT_JURIDIQUE[entreprise.statut] : undefined],
    [E.regimeFiscal, entreprise.regimeFiscal ? LABEL_REGIME_FISCAL[entreprise.regimeFiscal] : undefined],
  ];
  const renseignes = champs.filter(([, v]) => !!v);
  if (identite.length === 0 && renseignes.length === 0) return '';
  const ligneIdentite = identite.length > 0 ? `<div>${identite.join(' — ')}</div>` : '';
  const ligneChamps =
    renseignes.length > 0
      ? `<div class="exploitation-grid">${renseignes
          .map(([label, v]) => `<span><strong>${label} :</strong> ${echapper(v)}</span>`)
          .join('')}</div>`
      : '';
  return `<div class="exploitation">${ligneIdentite}${ligneChamps}</div>`;
}

/**
 * Export de l'année d'une entreprise en PDF : les chiffres clés, la synthèse mois par mois, les déclarations URSSAF, les
 * factures, puis (selon l'activité) les séjours du gîte et les trades. Les clients et les contenus des dossiers sont résumés en une
 * phrase : leur liste complète est dans l'export Excel.
 */
export async function exporterAnneeEntreprisePdf(annee: number): Promise<void> {
  const { titre, entreprise, sections, brut } = await rassemblerDonnees(annee);
  const P = TEXTES.export.pdf.entreprise;
  const T = TEXTES.export.entreprise;
  const tableau = (nom: string) => {
    const source = sections.find((x) => x.nom === nom);
    return sectionHtml(nom, tableauHtml(source?.lignes ?? [], source?.vide ?? '', { totaux: true }));
  };

  const { fiscalite, factures, avecTva } = brut;
  const cartes = cartesHtml([
    {
      libelle: P.cartes.caHt,
      valeur: formatMontant(fiscalite.caHt),
      detail: avecTva ? P.cartes.caTtc(formatMontant(fiscalite.caTtc)) : undefined,
    },
    ...(avecTva
      ? [
          { libelle: P.cartes.tvaCollectee, valeur: formatMontant(fiscalite.tvaCollectee) },
          { libelle: P.cartes.tvaDeductible, valeur: formatMontant(fiscalite.tvaDeductible) },
        ]
      : []),
    { libelle: P.cartes.aides, valeur: formatMontant(fiscalite.aides) },
    { libelle: P.cartes.factures, valeur: String(factures.length) },
    ...(brut.sejours ? [{ libelle: P.cartes.sejours, valeur: String(brut.sejours.length) }] : []),
  ]);

  const termines = brut.contenus.filter((e) => statutEffectif(e) === STATUT_ELEMENT.TERMINE).length;

  const corps = [
    cartes,
    tableau(T.synthese),
    tableau(T.urssaf),
    sectionHtml(T.factures, tableauHtml(lignesFacturesPdf(factures, avecTva), T.aucuneFacture)),
    ...(brut.sejours
      ? [sectionHtml(T.sejours, tableauHtml(lignesSejoursPdf(brut.sejours), T.aucunSejour))]
      : []),
    ...(brut.trades
      ? [
          sectionHtml(
            TEXTES.trading.export.section,
            tableauHtml(lignesTradesPdf(brut.trades), TEXTES.trading.export.aucun),
          ),
        ]
      : []),
    noteHtml(P.clients(brut.nombreClients)),
    noteHtml(P.contenus(brut.contenus.length, termines)),
    noteHtml(P.detailExcel),
  ].join('');

  await ecrireEtPartagerPdf(
    documentHtml(titre, undefined, corps, [], enTeteEntrepriseHtml(entreprise), {
      sousTitre: TEXTES.export.pdf.annee.sousTitre(annee),
    }),
    `${NOM_FICHIER_EXPORT_ENTREPRISE}_${annee}.${FORMAT_EXPORT.PDF}`,
    titre,
    { paysage: true },
  );
}

/** Export de l'année d'une entreprise en Excel : un onglet par section. */
export async function exporterAnneeEntrepriseExcel(annee: number): Promise<void> {
  const { titre, sections } = await rassemblerDonnees(annee);
  const classeur = XLSX.utils.book_new();
  for (const s of sections) {
    XLSX.utils.book_append_sheet(classeur, feuilleOuMessage(s.lignes, s.vide), s.nom.slice(0, 31));
  }
  await ecrireEtPartager(classeur, `${NOM_FICHIER_EXPORT_ENTREPRISE}_${annee}.${FORMAT_EXPORT.XLSX}`, titre);
}
