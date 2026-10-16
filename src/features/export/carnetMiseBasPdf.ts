import { listNaissancesGroupees, type PorteeNaissance } from '@/features/cheptel/repository/naissances';
import { documentHtml, echapper, ecrireEtPartagerPdf, sectionHtml, tableauHtml } from '@/features/export/services/htmlPdf';
import { getSettings } from '@/features/settings/settings';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const C = TEXTES.cheptel.naissances.carnet;

/** Une ligne du carnet : une mise bas (une mère, un jour). */
export function ligneDuCarnet(p: PorteeNaissance): Record<string, string | number> {
  const nes = p.cabrits.length;
  const mortNes = p.cabrits.filter((c) => c.statut === STATUT_CHEVRE.MORT_NE).length;
  const femelles = p.cabrits.filter((c) => c.sexe === SEXE.FEMELLE).length;
  const males = p.cabrits.filter((c) => c.sexe === SEXE.MALE).length;
  return {
    [C.colonnes.date]: formatDateFR(p.date),
    [C.colonnes.mere]: p.mereNumeroBoucle || C.inconnue,
    [C.colonnes.nes]: nes,
    [C.colonnes.vivants]: nes - mortNes,
    [C.colonnes.femelles]: femelles,
    [C.colonnes.males]: males,
    [C.colonnes.boucles]:
      p.cabrits
        .map((c) => c.numeroBoucle || C.sansBoucle)
        .join(', ') || '—',
    [C.colonnes.observations]: mortNes > 0 ? C.mortNes(mortNes) : '',
  };
}

/** Les mises bas rangées par année (de la plus récente à la plus ancienne), chacune de la plus ancienne à la plus récente. */
export function porteesParAnnee(portees: PorteeNaissance[]): { annee: string; portees: PorteeNaissance[] }[] {
  const parAnnee = new Map<string, PorteeNaissance[]>();
  for (const p of portees) {
    const annee = p.date.slice(0, 4);
    parAnnee.set(annee, [...(parAnnee.get(annee) ?? []), p]);
  }
  return [...parAnnee.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([annee, liste]) => ({ annee, portees: liste.sort((a, b) => a.date.localeCompare(b.date)) }));
}

/** Le corps du carnet : une section par année, avec le total des petits nés. */
export function carnetMiseBasHtml(portees: PorteeNaissance[]): string {
  const annees = porteesParAnnee(portees);
  if (annees.length === 0) return `<p class="vide">${echapper(C.aucune)}</p>`;
  return annees
    .map(({ annee, portees: liste }) => {
      const nes = liste.reduce((t, p) => t + p.cabrits.length, 0);
      return sectionHtml(
        `${C.annee(annee)} — ${C.resume(liste.length, nes)}`,
        tableauHtml(liste.map(ligneDuCarnet), C.aucune),
      );
    })
    .join('');
}

/** Crée le carnet de mise bas (PDF en paysage) de l'espèce courante, d'après les naissances enregistrées, et l'ouvre à l'envoi ou à l'impression. */
export async function exporterCarnetMiseBasPdf(): Promise<void> {
  const [portees, settings] = await Promise.all([listNaissancesGroupees(), getSettings()]);
  const html = documentHtml(C.titre, settings.exploitation, carnetMiseBasHtml(portees));
  await ecrireEtPartagerPdf(html, `${C.fichier}.${FORMAT_EXPORT.PDF}`, C.titre, { paysage: true });
}
