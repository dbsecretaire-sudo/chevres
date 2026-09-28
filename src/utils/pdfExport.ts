import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getSettings, type InfosExploitation } from '@/storage/settings';
import { loadAllYears, loadYear } from '@/storage/localStore';
import {
  listFactures,
  listVisitesVeterinaire,
  listControles,
  calculerBilanAlimentation,
} from '@/storage/repositories';
import { LABEL_TYPE_ALIMENT } from './planComptable';
import {
  chevreRow,
  venteRow,
  factureRow,
  visiteRow,
  controleRow,
  compteDeFacture,
} from './xlsxExport';
import { yearOf } from './dates';
import type { Chevre } from '@/types/models';

function echapper(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tableauHtml(rows: Record<string, unknown>[], messageVide: string): string {
  if (rows.length === 0) return `<p class="vide">${echapper(messageVide)}</p>`;
  const colonnes = Object.keys(rows[0]);
  const entetes = colonnes.map((c) => `<th>${echapper(c)}</th>`).join('');
  const lignes = rows
    .map((r) => `<tr>${colonnes.map((c) => `<td>${echapper(r[c])}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${entetes}</tr></thead><tbody>${lignes}</tbody></table>`;
}

function enTeteExploitationHtml(infos: InfosExploitation | undefined): string {
  if (!infos) return '';
  const identite = [infos.nomExploitant, infos.adresseExploitant].filter(Boolean).map(echapper);
  const champs: [string, string | undefined][] = [
    ['N° exploitation', infos.numeroExploitation],
    ['SIRET', infos.siret],
    ['N° cheptel', infos.numeroCheptel],
    ['Indicatif de marquage', infos.indicatifMarquage],
    ['N° pacage', infos.numeroPacage],
    ['N° détenteur', infos.numeroDetenteur],
  ];
  const champsRenseignes = champs.filter(([, v]) => !!v);
  if (identite.length === 0 && champsRenseignes.length === 0) return '';

  const ligneIdentite = identite.length > 0 ? `<div>${identite.join(' — ')}</div>` : '';
  const ligneChamps =
    champsRenseignes.length > 0
      ? `<div class="exploitation-grid">${champsRenseignes
          .map(([label, v]) => `<span><strong>${label} :</strong> ${echapper(v)}</span>`)
          .join('')}</div>`
      : '';
  return `<div class="exploitation">${ligneIdentite}${ligneChamps}</div>`;
}

function documentHtml(titre: string, infos: InfosExploitation | undefined, corps: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #25291F; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #2C4D29; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 2px solid #3F6B3A; padding-bottom: 4px; color: #2C4D29; }
  .exploitation { font-size: 11px; color: #6B6F63; margin: 8px 0 16px; line-height: 1.5; border-bottom: 1px solid #E1DDD0; padding-bottom: 10px; }
  .exploitation-grid { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #E1DDD0; padding: 5px 7px; font-size: 10px; text-align: left; }
  th { background: #EAF0E4; font-weight: 700; }
  .vide { font-size: 11px; color: #6B6F63; font-style: italic; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
  <h1>${echapper(titre)}</h1>
  ${enTeteExploitationHtml(infos)}
  ${corps}
</body>
</html>`;
}

async function ecrireEtPartagerPdf(html: string, nomFichier: string, titre: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const destination = `${FileSystem.cacheDirectory}${nomFichier}`;
  await FileSystem.copyAsync({ from: uri, to: destination });

  const disponible = await Sharing.isAvailableAsync();
  if (disponible) {
    await Sharing.shareAsync(destination, {
      mimeType: 'application/pdf',
      dialogTitle: titre,
      UTI: 'com.adobe.pdf',
    });
  }
}

/** Export complet de l'année (cheptel, ventes, factures, visites, contrôles) en PDF. */
export async function exporterAnneePdf(annee: number): Promise<void> {
  const [settings, chevres, ventes, factures, visites, controles] = await Promise.all([
    getSettings(),
    loadYear('cheptel', annee),
    loadYear('ventes', annee),
    loadYear('factures', annee),
    loadYear('visites_veterinaire', annee),
    loadYear('controles', annee),
  ]);

  const indicatif = settings.exploitation?.indicatifMarquage;
  const corps = `
    <h2>Cheptel</h2>
    ${tableauHtml(chevres.map((c) => chevreRow(c, indicatif)), 'Aucun animal enregistré pour cette année')}
    <h2>Ventes</h2>
    ${tableauHtml(ventes.map(venteRow), 'Aucune vente pour cette année')}
    <h2>Factures</h2>
    ${tableauHtml(factures.map(factureRow), 'Aucune facture pour cette année')}
    <h2>Visites vétérinaire</h2>
    ${tableauHtml(visites.map((v) => visiteRow(v, indicatif)), 'Aucune visite pour cette année')}
    <h2>Contrôles</h2>
    ${tableauHtml(controles.map((c) => controleRow(c, indicatif)), 'Aucun contrôle pour cette année')}
  `;

  const html = documentHtml(`Export ${annee} — Troupeau Chèvres`, settings.exploitation, corps);
  await ecrireEtPartagerPdf(html, `troupeau_chevres_${annee}.pdf`, `Export ${annee} — Troupeau Chèvres`);
}

/** Rapport Exploitation (vétérinaire + contrôles + alimentation) en PDF. */
export async function exporterExploitationPdf(annee: number): Promise<void> {
  const [settings, visites, controles, alimentation] = await Promise.all([
    getSettings(),
    listVisitesVeterinaire(annee),
    listControles(annee),
    calculerBilanAlimentation(annee),
  ]);

  const lignesAlimentation = [
    ...(['mais', 'luzerne', 'foin', 'paille', 'autre'] as const).map((type) => ({
      Aliment: LABEL_TYPE_ALIMENT[type],
      'Montant (€)': alimentation.parType[type].montant,
      'Quantité (kg)': alimentation.parType[type].quantiteKg,
      'Kg par animal': alimentation.kgParAnimalParType[type] ?? '—',
    })),
    {
      Aliment: 'Total (hors Autre)',
      'Montant (€)': alimentation.total,
      'Quantité (kg)': alimentation.totalKg,
      'Kg par animal': '—',
    },
  ];

  const indicatif = settings.exploitation?.indicatifMarquage;
  const corps = `
    <h2>Visites vétérinaire</h2>
    ${tableauHtml(visites.map((v) => visiteRow(v, indicatif)), 'Aucune visite pour cette année')}
    <h2>Contrôles</h2>
    ${tableauHtml(controles.map((c) => controleRow(c, indicatif)), 'Aucun contrôle pour cette année')}
    <h2>Alimentation</h2>
    ${tableauHtml(lignesAlimentation, 'Aucune donnée')}
    <p>Effectif (chèvres + boucs + cabris de plus de 2 mois) : ${alimentation.nombreAnimaux} — Coût par animal : ${
      alimentation.coutParAnimal !== undefined ? `${alimentation.coutParAnimal.toFixed(2)} €` : '—'
    } (« Autre » exclu du total et du calcul par animal)</p>
  `;

  const html = documentHtml(`Exploitation ${annee} — Troupeau Chèvres`, settings.exploitation, corps);
  await ecrireEtPartagerPdf(html, `exploitation_${annee}.pdf`, `Exploitation ${annee} — Troupeau Chèvres`);
}

/** Plan comptable indicatif de l'année en PDF (voir avertissement sur l'écran Comptabilité). */
export async function exporterPlanComptablePdf(annee: number): Promise<void> {
  const [settings, factures] = await Promise.all([getSettings(), listFactures(annee)]);

  const parCompte = new Map<string, { libelle: string; total: number; count: number }>();
  for (const f of factures) {
    const compte = compteDeFacture(f);
    if (!compte) continue;
    const existant = parCompte.get(compte.numero) ?? { libelle: compte.libelle, total: 0, count: 0 };
    existant.total += f.type === 'recue' ? -f.montant : f.montant;
    existant.count += 1;
    parCompte.set(compte.numero, existant);
  }
  const lignesRecap = Array.from(parCompte.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([numero, v]) => ({
      'N° compte': numero,
      Libellé: v.libelle,
      'Nombre de factures': v.count,
      'Solde (€)': v.total.toFixed(2),
    }));

  const corps = `
    <h2>Récapitulatif par compte</h2>
    ${tableauHtml(lignesRecap, 'Aucune facture catégorisée pour cette année')}
    <h2>Détail des factures</h2>
    ${tableauHtml(factures.map(factureRow), 'Aucune facture pour cette année')}
  `;

  const html = documentHtml(`Plan comptable ${annee} — Troupeau Chèvres`, settings.exploitation, corps);
  await ecrireEtPartagerPdf(html, `plan_comptable_${annee}.pdf`, `Plan comptable ${annee} — Troupeau Chèvres`);
}

type LigneRegistre = { [K in keyof ReturnType<typeof chevreRow>]: string } & { Descendance: string };

/**
 * L'année de la ligne d'un animal, c'est son année de désignation au renouvellement quand elle est
 * connue (comme pour le bilan), sinon son année de naissance — un cabrit né au second semestre peut
 * par exemple être désigné l'année suivante.
 */
function anneeDesignation(c: Chevre): number {
  return c.renouvellement && c.renouvellementAnnee !== undefined ? c.renouvellementAnnee : yearOf(c.dateNaissance);
}

/**
 * Regroupe le cheptel par année de désignation plutôt que par année de naissance. Les cabrits pas
 * encore bouclés n'ont pas de ligne propre (rien à y présenter d'exploitable) ; ils sont comptés dans
 * la colonne « Descendance » de leur mère, qui indique le nombre total de petits qu'elle a eus.
 */
function construireRegistreCheptel(toutes: Chevre[], indicatif?: string): Map<number, LigneRegistre[]> {
  const bouclees = toutes.filter((c) => !!c.numeroBoucle);

  const nombreDescendance = (mere: Chevre) =>
    toutes.filter((c) => c.mereId === mere.id || (!!mere.numeroBoucle && c.mereNumeroBoucle === mere.numeroBoucle))
      .length;

  const parAnnee = new Map<number, LigneRegistre[]>();
  for (const annee of new Set(bouclees.map(anneeDesignation))) {
    const lignesAnnee = bouclees
      .filter((c) => anneeDesignation(c) === annee)
      .sort((a, b) => {
        const na = Number(a.numeroBoucle);
        const nb = Number(b.numeroBoucle);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return (a.numeroBoucle ?? '').localeCompare(b.numeroBoucle ?? '');
      })
      .map((c) => {
        const descendance = nombreDescendance(c);
        return { ...chevreRow(c, indicatif), Descendance: descendance > 0 ? String(descendance) : '' };
      });
    parAnnee.set(annee, lignesAnnee);
  }

  return parAnnee;
}

/**
 * Registre complet du cheptel en PDF : une section par année de désignation (renouvellement si
 * connue, sinon naissance), avec saut de page entre chaque. La colonne Descendance indique le nombre
 * total de petits de chaque mère ; les cabris pas encore bouclés n'ont pas de ligne propre (rien à y
 * présenter d'exploitable) mais restent comptés dans cette colonne.
 */
export async function exporterCheptelPdf(): Promise<void> {
  const [settings, toutes] = await Promise.all([getSettings(), loadAllYears('cheptel')]);
  const indicatif = settings.exploitation?.indicatifMarquage;
  const registre = construireRegistreCheptel(toutes, indicatif);
  const anneesTriees = [...registre.keys()].sort((a, b) => a - b);

  const note = `<p class="vide">Regroupement par année de désignation au renouvellement quand elle est indiquée, sinon par année de naissance. La colonne « Descendance » indique le nombre total de petits de chaque mère (les cabris pas encore bouclés n'ont pas de ligne propre mais sont comptés ici).</p>`;

  let corps: string;
  if (anneesTriees.length === 0) {
    corps = `<h2>Cheptel</h2>${note}${tableauHtml([], 'Aucun animal enregistré')}`;
  } else {
    corps = anneesTriees
      .map((annee, index) => {
        const classe = index > 0 ? ' page-break' : '';
        return `<div class="${classe}"><h2>Cheptel ${annee}</h2>${index === 0 ? note : ''}${tableauHtml(
          registre.get(annee) ?? [],
          'Aucun animal pour cette année',
        )}</div>`;
      })
      .join('');
  }

  const html = documentHtml('Cheptel — Troupeau Chèvres', settings.exploitation, corps);
  await ecrireEtPartagerPdf(html, 'cheptel.pdf', 'Cheptel — Troupeau Chèvres');
}
