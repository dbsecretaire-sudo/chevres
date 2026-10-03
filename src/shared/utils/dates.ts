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
