import { DECIMALES_MONTANT, DEVISE, LOCALE } from '@/shared/constants/format';
export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Vrai pour une vraie date au format YYYY-MM-DD (« 2026-20-04 » ou « 2026-02-30 » ne le sont pas). */
export function estDateISO(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const [annee, mois, jour] = valeur.split('-').map(Number);
  const date = new Date(annee, mois - 1, jour);
  return date.getFullYear() === annee && date.getMonth() === mois - 1 && date.getDate() === jour;
}

export function yearOf(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

/** Formate une date ISO (YYYY-MM-DD) en format français court: "26/09/2026" */
export function formatDateFR(isoDate?: string): string {
  return formatDateShortFR(isoDate);
}

/** Formate une date ISO en format court: "03/03/2026" */
export function formatDateShortFR(isoDate?: string): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

const FORMATTEUR_MONTANT = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: DEVISE,
  minimumFractionDigits: DECIMALES_MONTANT,
  maximumFractionDigits: DECIMALES_MONTANT,
});

/** Présentation comptable : séparateur de milliers, virgule décimale (ex: "1 000,00 €"). */
export function formatMontant(montant?: number): string {
  if (montant === undefined || montant === null || Number.isNaN(montant)) return '—';
  return FORMATTEUR_MONTANT.format(montant);
}

export function currentYear(): number {
  return new Date().getFullYear();
}

/** Le même jour dans une autre année (le 29 février devient le 28 si l'année n'est pas bissextile) ; vide reste vide. */
export function memeJourDansLAnnee(isoDate: string, annee: number): string {
  if (!estDateISO(isoDate)) return isoDate;
  const mois = isoDate.slice(5, 7);
  const jour = Number(isoDate.slice(8, 10));
  const dernierJour = new Date(annee, Number(mois), 0).getDate();
  return `${annee}-${mois}-${String(Math.min(jour, dernierJour)).padStart(2, '0')}`;
}

/** Aujourd'hui, dans l'année donnée (là où s'ouvre le choix d'une date quand aucune n'est saisie). */
export function aujourdhuiDansLAnnee(annee: number): string {
  return memeJourDansLAnnee(todayISO(), annee);
}

/** Une date AAAA-MM-JJ écrite JJ/MM/AAAA (le format des champs de date du poste) ; une valeur qui n'en est pas une est rendue telle quelle. */
export function enJourMoisAnnee(isoDate: string): string {
  return estDateISO(isoDate)
    ? `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}`
    : isoDate;
}

/** Le jour et le mois d'une date AAAA-MM-JJ, écrits JJ/MM (l'année étant imposée à côté) ; vide pour une valeur qui n'est pas une date. */
export function jourEtMois(isoDate: string): string {
  return estDateISO(isoDate) ? `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}` : '';
}

/**
 * Une date saisie « JJ/MM/AAAA » (ou « J/M/AAAA », avec « / », « - » ou « . ») en AAAA-MM-JJ ; avec `annee`, la saisie est
 * « JJ/MM » seulement et l'année est celle donnée. Vide quand ce n'est pas une vraie date.
 */
export function depuisJourMoisAnnee(texte: string, annee?: number): string {
  const m = /^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{4}))?$/.exec(texte.trim());
  if (!m) return '';
  const an = annee ?? (m[3] ? Number(m[3]) : undefined);
  if (an === undefined) return '';
  const iso = `${an}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return estDateISO(iso) ? iso : '';
}
