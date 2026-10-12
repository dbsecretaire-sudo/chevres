import type { Chevre } from '@/features/cheptel/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';
import { chevreRow, type IndicatifParEspece } from '@/features/export/services/lignesExport';
import { yearOf } from '@/shared/utils/dates';

/** Une ligne du registre : une valeur par colonne. */
export type LigneRegistre = Record<string, string>;

/** Ce qu'on écrit à la place d'un numéro de boucle quand l'animal n'en a pas (registre complet). */
const TRAIT = '—';

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

export interface OptionsRegistre {
  /**
   * Tous les animaux bouclés — vivants, morts, vendus, abattus, autoconsommés — avec leur statut (sans les notes), et les
   * animaux autoconsommés sans boucle (un trait à la place du numéro) ; les autres animaux sans boucle n'y figurent pas. Sans cette
   * option : les seuls animaux vivants et bouclés, sans les colonnes du statut et des notes.
   */
  complet?: boolean;
}

/**
 * Regroupe le cheptel par année de désignation plutôt que par année de naissance. Par défaut, seuls les animaux vivants et bouclés
 * y figurent (les cabrits pas encore bouclés n'ont pas de ligne propre), sans les colonnes des notes et du statut ; avec
 * `complet`, tous les animaux, avec leur statut (jamais les notes).
 */
export function construireRegistreCheptel(
  toutes: Chevre[],
  indicatif?: IndicatifParEspece,
  options: OptionsRegistre = {},
): Map<number, LigneRegistre[]> {
  // Complet : tous les animaux bouclés, et ceux sans boucle seulement s'ils ont été autoconsommés (un trait tient lieu de numéro) ;
  // les autres animaux sans boucle n'y figurent pas.
  const retenues = options.complet
    ? toutes.filter((c) => !!c.numeroBoucle || c.statut === STATUT_CHEVRE.AUTOCONSOMMEE)
    : toutes.filter((c) => !!c.numeroBoucle && c.statut === STATUT_CHEVRE.VIVANTE);

  const parAnnee = new Map<number, LigneRegistre[]>();
  for (const annee of new Set(retenues.map(anneeDesignation))) {
    const lignesAnnee = retenues
      .filter((c) => anneeDesignation(c) === annee)
      .sort((a, b) => {
        // Les animaux sans boucle viennent à la fin de leur année, du plus ancien au plus récent.
        if (!a.numeroBoucle || !b.numeroBoucle) {
          return a.numeroBoucle ? -1 : b.numeroBoucle ? 1 : a.dateNaissance.localeCompare(b.dateNaissance);
        }
        const na = Number(a.numeroBoucle);
        const nb = Number(b.numeroBoucle);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return a.numeroBoucle.localeCompare(b.numeroBoucle);
      })
      .map((c): LigneRegistre => {
        const ligne = chevreRow(c, indicatif);
        const colonneBoucle = TEXTES.export.colonnes.nBoucle;
        const { [TEXTES.export.colonnes.notes]: _notes, ...sansNotes } = ligne;
        // Complet : on garde le statut, et un trait remplace le numéro d'un animal sans boucle.
        if (options.complet) return { ...sansNotes, [colonneBoucle]: sansNotes[colonneBoucle] || TRAIT };
        const { [TEXTES.export.colonnes.statut]: _statut, ...restantes } = sansNotes;
        return restantes;
      });
    parAnnee.set(annee, lignesAnnee);
  }

  return parAnnee;
}
