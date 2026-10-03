import type { Chevre } from '@/features/cheptel/types';
import { chevreRow } from '@/features/export/services/lignesExport';
import { yearOf } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

export type LigneRegistre = { [K in keyof ReturnType<typeof chevreRow>]: string } & {
  [TEXTES.export.colonnes.descendance]: string;
};

/**
 * L'année de la ligne d'un animal, c'est son année de désignation au renouvellement quand elle est
 * connue (comme pour le bilan), sinon son année de naissance — un cabrit né au second semestre peut
 * par exemple être désigné l'année suivante.
 */
function anneeDesignation(c: Chevre): number {
  return c.renouvellement && c.renouvellementAnnee !== undefined
    ? c.renouvellementAnnee
    : yearOf(c.dateNaissance);
}

/**
 * Regroupe le cheptel par année de désignation plutôt que par année de naissance. Les cabrits pas
 * encore bouclés n'ont pas de ligne propre (rien à y présenter d'exploitable) ; ils sont comptés dans
 * la colonne « Descendance » de leur mère, qui indique le nombre total de petits qu'elle a eus.
 */
export function construireRegistreCheptel(
  toutes: Chevre[],
  indicatif?: string,
): Map<number, LigneRegistre[]> {
  const bouclees = toutes.filter((c) => !!c.numeroBoucle);

  const nombreDescendance = (mere: Chevre) =>
    toutes.filter(
      (c) => c.mereId === mere.id || (!!mere.numeroBoucle && c.mereNumeroBoucle === mere.numeroBoucle),
    ).length;

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
        return {
          ...chevreRow(c, indicatif),
          [TEXTES.export.colonnes.descendance]: descendance > 0 ? String(descendance) : '',
        };
      });
    parAnnee.set(annee, lignesAnnee);
  }

  return parAnnee;
}
