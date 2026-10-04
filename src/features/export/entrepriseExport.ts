import * as XLSX from 'xlsx';
import { getSettings, type InfosEntreprise } from '@/features/settings/settings';
import { listClients } from '@/features/clients/repository';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import { calculerFiscaliteEntreprise } from '@/features/entreprise/services/fiscaliteEntreprise';
import { lireArchiveGite } from '@/features/gite/repository';
import { ecrireEtPartager, feuilleOuMessage } from '@/features/export/services/classeurXlsx';
import { documentHtml, echapper, ecrireEtPartagerPdf, tableauHtml } from '@/features/export/services/htmlPdf';
import {
  clientRow,
  elementRow,
  factureEntrepriseRow,
  lignesSynthese,
  sejourRow,
} from '@/features/export/services/lignesEntreprise';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_ENTREPRISE } from '@/shared/constants/export';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { LABEL_REGIME_FISCAL, LABEL_STATUT_JURIDIQUE } from '@/shared/textes/libelles';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';

type Ligne = Record<string, unknown>;

interface DonneesEntreprise {
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

  const sections: DonneesEntreprise['sections'] = [
    { nom: T.synthese, lignes: lignesSynthese(fiscalite, avecTva), vide: T.aucuneFacture },
    {
      nom: T.factures,
      lignes: factures.map((f) => factureEntrepriseRow(f, avecTva)),
      vide: T.aucuneFacture,
    },
    { nom: T.clients, lignes: clients.map(clientRow), vide: T.aucunClient },
    {
      nom: T.contenus,
      lignes: dossiers.elements
        .filter((e) => delAnnee(e.date) || delAnnee(e.echeance))
        .map((e) => elementRow(e, clients, dossiers.sousDossiers)),
      vide: T.aucunContenu,
    },
  ];

  if (activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION)) {
    const gite = await lireArchiveGite();
    sections.push({
      nom: T.sejours,
      lignes: gite.sejours
        .filter((s) => delAnnee(s.arrivee))
        .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
        .map(sejourRow),
      vide: T.aucunSejour,
    });
  }

  const nom = entreprise?.nomEntreprise?.trim() || T.nomParDefaut;
  return { titre: T.titreExport(annee, nom), entreprise, sections };
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

/** Export de l'année d'une entreprise en PDF. */
export async function exporterAnneeEntreprisePdf(annee: number): Promise<void> {
  const { titre, entreprise, sections } = await rassemblerDonnees(annee);
  const corps = sections.map((s) => `<h2>${echapper(s.nom)}</h2>${tableauHtml(s.lignes, s.vide)}`).join('');
  await ecrireEtPartagerPdf(
    documentHtml(titre, undefined, corps, [], enTeteEntrepriseHtml(entreprise)),
    `${NOM_FICHIER_EXPORT_ENTREPRISE}_${annee}.${FORMAT_EXPORT.PDF}`,
    titre,
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
