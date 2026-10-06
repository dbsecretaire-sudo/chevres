import type { Sejour } from '@/features/gite/types';
import { SERVICE_REPAS, SERVICE_REPAS_PAR_DEFAUT } from '@/shared/constants/gite';
import { nuitsDuSejour } from '@/shared/utils/calendrier';

/**
 * Les repas d'un séjour, répartis sur ses nuits : le total est partagé à parts égales, les repas en plus allant aux
 * premières nuits. Avec le calcul par défaut (personnes × nuits, ×2 midi et soir), chaque nuit a donc le même nombre.
 */
export function repasParNuit(sejour: Sejour): Map<string, number> {
  const repas = new Map<string, number>();
  const nuits = nuitsDuSejour(sejour.arrivee, sejour.depart);
  const total = sejour.repas ?? 0;
  if (nuits.length === 0 || total <= 0) return repas;
  const base = Math.floor(total / nuits.length);
  const reste = total % nuits.length;
  nuits.forEach((nuit, i) => repas.set(nuit, base + (i < reste ? 1 : 0)));
  return repas;
}

/** Les repas d'un jour partagés entre le midi et le soir selon le service de la réservation. */
function partagerParService(sejour: Sejour, repas: number): { midi: number; soir: number } {
  const service = sejour.service ?? SERVICE_REPAS_PAR_DEFAUT;
  if (service === SERVICE_REPAS.MIDI) return { midi: repas, soir: 0 };
  if (service === SERVICE_REPAS.SOIR) return { midi: 0, soir: repas };
  return { midi: Math.ceil(repas / 2), soir: Math.floor(repas / 2) };
}

/** Le nombre total de repas à préparer chaque jour, tous séjours confondus (les jours sans repas n'y figurent pas). */
export function repasParJour(sejours: Sejour[]): Map<string, number> {
  const total = new Map<string, number>();
  for (const sejour of sejours) {
    for (const [jour, repas] of repasParNuit(sejour)) {
      if (repas > 0) total.set(jour, (total.get(jour) ?? 0) + repas);
    }
  }
  return total;
}

export interface RepasReservation {
  sejour: Sejour;
  repas: number;
  midi: number;
  soir: number;
}

/** Les réservations qui ont des repas ce jour-là, avec leur nombre de repas à midi et le soir. */
export function repasDuJour(sejours: Sejour[], jour: string): RepasReservation[] {
  return sejours
    .map((sejour) => {
      const repas = repasParNuit(sejour).get(jour) ?? 0;
      return { sejour, repas, ...partagerParService(sejour, repas) };
    })
    .filter((r) => r.repas > 0)
    .sort((a, b) => a.sejour.nom.localeCompare(b.sejour.nom));
}
