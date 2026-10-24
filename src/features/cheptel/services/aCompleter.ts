import type { Chevre } from '@/features/cheptel/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

/** Les animaux saisis vite sur le terrain (par le berger) dont les détails restent à compléter, du plus récent au plus ancien. */
export const animauxACompleter = (animaux: readonly Chevre[]): Chevre[] =>
  animaux
    .filter((a) => a.aCompleter)
    .sort((a, b) => (b.dateStatut ?? b.dateNaissance).localeCompare(a.dateStatut ?? a.dateNaissance));

/** Ce que le berger a saisi : « Naissance du 24/10/2026 · mère 52 » ou « Morte le 24/10/2026 ». */
export const libelleACompleter = (a: Pick<Chevre, 'statut' | 'dateStatut' | 'dateNaissance' | 'mereNumeroBoucle'>): string => {
  const T = TEXTES.roles.aCompleter;
  if (a.statut !== STATUT_CHEVRE.VIVANTE) return T.morteLe(formatDateFR(a.dateStatut ?? a.dateNaissance));
  return [T.naissanceDu(formatDateFR(a.dateNaissance)), a.mereNumeroBoucle ? T.mereDe(a.mereNumeroBoucle) : undefined].filter(Boolean).join(' · ');
};

/** La fiche, une fois complétée : elle n'est plus « à compléter ». */
export const completee = (a: Chevre): Chevre => ({ ...a, aCompleter: undefined });
