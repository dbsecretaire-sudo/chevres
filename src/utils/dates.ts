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

const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Formate une date ISO (YYYY-MM-DD) en format lisible français: "3 mars 2026" */
export function formatDateFR(isoDate?: string): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${MOIS_FR[m - 1]} ${y}`;
}

/** Formate une date ISO en format court: "03/03/2026" */
export function formatDateShortFR(isoDate?: string): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export function formatMontant(montant?: number): string {
  if (montant === undefined || montant === null || Number.isNaN(montant)) return '—';
  return `${montant.toFixed(2).replace('.', ',')} €`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}
