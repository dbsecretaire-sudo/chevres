import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { CATEGORIE_LABELS, CATEGORIES } from '@/storage/csv';
import { getYears, loadYear } from '@/storage/localStore';
import { getSettings } from '@/storage/settings';
import { listFactures, listVisitesVeterinaire, listControles, calculerBilanAlimentation } from '@/storage/repositories';
import { formatDateShortFR } from './dates';
import {
  COMPTE_PAR_DEPENSE,
  COMPTE_PAR_RECETTE,
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
  LABEL_TYPE_ALIMENT,
} from './planComptable';
import type { Categorie, Chevre, Controle, Facture, Vente, VisiteVeterinaire } from '@/types/models';

/** Fait précéder un n° de boucle de l'indicatif de marquage du troupeau, quand il est renseigné. */
export function avecIndicatif(numero: string | undefined, indicatif: string | undefined): string {
  if (!numero) return '';
  return indicatif ? `${indicatif}${numero}` : numero;
}

export function chevreRow(c: Chevre, indicatif?: string) {
  return {
    'N° boucle': avecIndicatif(c.numeroBoucle, indicatif),
    Nom: c.nom ?? '',
    Sexe: c.sexe,
    'Date de naissance': formatDateShortFR(c.dateNaissance),
    'Mère (n° boucle)': avecIndicatif(c.mereNumeroBoucle, indicatif),
    Statut: c.statut,
    'Date statut': formatDateShortFR(c.dateStatut),
    Renouvellement: c.renouvellement ? 'Oui' : '',
    Notes: c.notes ?? '',
  };
}

export function venteRow(v: Vente) {
  return {
    Date: formatDateShortFR(v.date),
    Catégorie: v.categorie,
    'Type fromage': v.typeFromage === 'autre' ? v.typeFromageLibre : v.typeFromage ?? '',
    Quantité: v.quantite,
    Unité: v.unite,
    'Prix (€)': v.prix,
  };
}

export function compteDeFacture(f: Facture): { numero: string; libelle: string } | undefined {
  if (f.type === 'recue' && f.categorieDepense === 'autre' && f.compteManuel) {
    const trouve = Object.values(COMPTE_PAR_DEPENSE).find((c) => c.numero === f.compteManuel);
    if (trouve) return trouve;
  }
  if (f.type === 'emise' && f.categorieRecette === 'autre' && f.compteManuel) {
    const trouve = Object.values(COMPTE_PAR_RECETTE).find((c) => c.numero === f.compteManuel);
    if (trouve) return trouve;
  }
  if (f.type === 'recue' && f.categorieDepense) return COMPTE_PAR_DEPENSE[f.categorieDepense];
  if (f.type === 'emise' && f.categorieRecette) return COMPTE_PAR_RECETTE[f.categorieRecette];
  return undefined;
}

export function factureRow(f: Facture) {
  const compte = compteDeFacture(f);
  return {
    Date: formatDateShortFR(f.date),
    Type: f.type === 'recue' ? 'Débit' : 'Crédit',
    'Fournisseur / Client': f.tiers,
    Note: f.description,
    Catégorie: f.type === 'recue' ? (f.categorieDepense ? LABEL_CATEGORIE_DEPENSE[f.categorieDepense] : '') : f.categorieRecette ? LABEL_CATEGORIE_RECETTE[f.categorieRecette] : '',
    'N° compte PCG': compte?.numero ?? '',
    'Libellé compte': compte?.libelle ?? '',
    'Montant (€)': f.montant,
  };
}

export function visiteRow(v: VisiteVeterinaire, indicatif?: string) {
  return {
    Date: formatDateShortFR(v.date),
    'N° boucle': v.chevreNumeroBoucle ? avecIndicatif(v.chevreNumeroBoucle, indicatif) : 'Troupeau entier',
    Motif: v.motif,
    Description: v.description ?? '',
    'Coût (€)': v.cout ?? '',
  };
}

export function controleRow(c: Controle, indicatif?: string) {
  return {
    Date: formatDateShortFR(c.date),
    'N° boucle': c.chevreNumeroBoucle ? avecIndicatif(c.chevreNumeroBoucle, indicatif) : 'Troupeau entier',
    Type: c.type,
    Résultat: c.resultat ?? '',
    Notes: c.notes ?? '',
  };
}

const ROW_BUILDERS: Record<Categorie, (items: any[], indicatif?: string) => Record<string, unknown>[]> = {
  cheptel: (items, indicatif) => items.map((c) => chevreRow(c, indicatif)),
  ventes: (items) => items.map(venteRow),
  factures: (items) => items.map(factureRow),
  visites_veterinaire: (items, indicatif) => items.map((v) => visiteRow(v, indicatif)),
  controles: (items, indicatif) => items.map((c) => controleRow(c, indicatif)),
};

async function ecrireEtPartager(workbook: XLSX.WorkBook, nomFichier: string, titre: string): Promise<void> {
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const fileUri = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: titre,
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }
}

/** Génère un classeur Excel (un onglet par catégorie) pour l'année donnée et ouvre le menu de partage. */
export async function exporterAnneeExcel(annee: number): Promise<void> {
  const settings = await getSettings();
  const indicatif = settings.exploitation?.indicatifMarquage;
  const workbook = XLSX.utils.book_new();

  for (const categorie of CATEGORIES) {
    const items = await loadYear(categorie, annee);
    const rows = ROW_BUILDERS[categorie](items, indicatif);
    const sheet =
      rows.length > 0
        ? XLSX.utils.json_to_sheet(rows)
        : XLSX.utils.aoa_to_sheet([['Aucune donnée pour cette année']]);
    XLSX.utils.book_append_sheet(workbook, sheet, CATEGORIE_LABELS[categorie].slice(0, 31));
  }

  await ecrireEtPartager(workbook, `troupeau_chevres_${annee}.xlsx`, `Export ${annee} — Troupeau Chèvres`);
}

/** Rapport Exploitation : vétérinaire + contrôles + alimentation (avec coût par animal) pour l'année donnée. */
export async function exporterExploitationExcel(annee: number): Promise<void> {
  const [settings, visites, controles, alimentation] = await Promise.all([
    getSettings(),
    listVisitesVeterinaire(annee),
    listControles(annee),
    calculerBilanAlimentation(annee),
  ]);
  const indicatif = settings.exploitation?.indicatifMarquage;

  const workbook = XLSX.utils.book_new();

  const feuilleVet =
    visites.length > 0
      ? XLSX.utils.json_to_sheet(visites.map((v) => visiteRow(v, indicatif)))
      : XLSX.utils.aoa_to_sheet([['Aucune visite pour cette année']]);
  XLSX.utils.book_append_sheet(workbook, feuilleVet, 'Vétérinaire');

  const feuilleControles =
    controles.length > 0
      ? XLSX.utils.json_to_sheet(controles.map((c) => controleRow(c, indicatif)))
      : XLSX.utils.aoa_to_sheet([['Aucun contrôle pour cette année']]);
  XLSX.utils.book_append_sheet(workbook, feuilleControles, 'Contrôles');

  const lignesAlimentation = [
    ...(['mais', 'luzerne', 'foin', 'paille', 'autre'] as const).map((type) => ({
      Aliment: LABEL_TYPE_ALIMENT[type],
      'Montant (€)': alimentation.parType[type].montant,
      'Quantité (kg)': alimentation.parType[type].quantiteKg,
      'Kg par animal': alimentation.kgParAnimalParType[type] ?? '',
    })),
    { Aliment: 'Total (hors Autre)', 'Montant (€)': alimentation.total, 'Quantité (kg)': alimentation.totalKg, 'Kg par animal': '' },
    { Aliment: '', 'Montant (€)': '', 'Quantité (kg)': '', 'Kg par animal': '' },
    { Aliment: 'Effectif (chèvres + boucs + cabrits > 2 mois)', 'Montant (€)': alimentation.nombreAnimaux, 'Quantité (kg)': '', 'Kg par animal': '' },
    { Aliment: 'Coût par animal (€, hors Autre)', 'Montant (€)': alimentation.coutParAnimal ?? '', 'Quantité (kg)': '', 'Kg par animal': '' },
  ];
  const feuilleAlimentation = XLSX.utils.json_to_sheet(lignesAlimentation);
  XLSX.utils.book_append_sheet(workbook, feuilleAlimentation, 'Alimentation');

  await ecrireEtPartager(workbook, `exploitation_${annee}.xlsx`, `Exploitation ${annee} — Troupeau Chèvres`);
}

/**
 * Plan comptable indicatif : regroupe toutes les factures de l'année par compte PCG,
 * avec le total par compte. Correspondance non validée par un expert-comptable — à
 * confirmer avant tout usage officiel.
 */
export async function exporterPlanComptableExcel(annee: number): Promise<void> {
  const factures = await listFactures(annee);

  const parCompte = new Map<string, { libelle: string; total: number; count: number }>();
  for (const f of factures) {
    const compte = compteDeFacture(f);
    if (!compte) continue;
    const cle = compte.numero;
    const existant = parCompte.get(cle) ?? { libelle: compte.libelle, total: 0, count: 0 };
    existant.total += f.type === 'recue' ? -f.montant : f.montant;
    existant.count += 1;
    parCompte.set(cle, existant);
  }

  const lignesRecap = Array.from(parCompte.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([numero, v]) => ({
      'N° compte': numero,
      Libellé: v.libelle,
      'Nombre de factures': v.count,
      'Solde (€)': v.total,
    }));

  const workbook = XLSX.utils.book_new();
  const feuilleRecap =
    lignesRecap.length > 0
      ? XLSX.utils.json_to_sheet(lignesRecap)
      : XLSX.utils.aoa_to_sheet([['Aucune facture catégorisée pour cette année']]);
  XLSX.utils.book_append_sheet(workbook, feuilleRecap, 'Plan comptable');

  const feuilleDetail =
    factures.length > 0
      ? XLSX.utils.json_to_sheet(factures.map(factureRow))
      : XLSX.utils.aoa_to_sheet([['Aucune facture pour cette année']]);
  XLSX.utils.book_append_sheet(workbook, feuilleDetail, 'Détail factures');

  await ecrireEtPartager(workbook, `plan_comptable_${annee}.xlsx`, `Plan comptable ${annee} — Troupeau Chèvres`);
}

/** Registre complet du cheptel : un onglet par année (vivantes et historique confondues). */
export async function exporterCheptelExcel(): Promise<void> {
  const [settings, annees] = await Promise.all([getSettings(), getYears('cheptel')]);
  const indicatif = settings.exploitation?.indicatifMarquage;
  const workbook = XLSX.utils.book_new();

  const anneesTriees = [...annees].sort((a, b) => a - b);
  if (anneesTriees.length === 0) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Aucun animal enregistré']]), 'Cheptel');
  } else {
    for (const annee of anneesTriees) {
      const chevres = await loadYear('cheptel', annee);
      const feuille =
        chevres.length > 0
          ? XLSX.utils.json_to_sheet(chevres.map((c) => chevreRow(c, indicatif)))
          : XLSX.utils.aoa_to_sheet([['Aucun animal pour cette année']]);
      XLSX.utils.book_append_sheet(workbook, feuille, String(annee));
    }
  }

  await ecrireEtPartager(workbook, 'cheptel.xlsx', 'Cheptel — Troupeau Chèvres');
}
