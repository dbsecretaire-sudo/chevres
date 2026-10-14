import type { ReglageAmortissementFromagerie } from '@/features/settings/settings';
import { DUREE_AMORTISSEMENT_DEFAUT } from '@/shared/constants/lait';

/** Un élément de la fromagerie amorti : son montant, sa durée d'amortissement et ce qu'il coûte chaque année. */
export interface LigneAmortissement {
  libelle: string;
  montant: number;
  /** La durée d'amortissement, en années. */
  duree: number;
  annuel: number;
}

export interface CalculAmortissement {
  /** Vrai quand l'utilisateur inclut l'amortissement de la fromagerie dans la simulation (et qu'il y a un montant). */
  inclure: boolean;
  /** Le montant total de la fromagerie. */
  total: number;
  /** L'amortissement d'une année (linéaire : chaque montant divisé par sa durée). */
  annuel: number;
  lignes: LigneAmortissement[];
}

/**
 * L'amortissement de la fromagerie (calcul pur) : un montant unique, ou le détail de ses éléments (local, cuve, matériel…), chacun
 * amorti sur sa durée en ligne droite. La durée vaut DUREE_AMORTISSEMENT_DEFAUT tant qu'elle n'est pas donnée ; elle est à fixer avec
 * le comptable. L'amortissement n'entre dans la simulation que si l'utilisateur l'a choisi.
 */
export function calculerAmortissement(
  reglage: ReglageAmortissementFromagerie | undefined,
): CalculAmortissement {
  const duree = (valeur?: number): number => (valeur && valeur > 0 ? valeur : DUREE_AMORTISSEMENT_DEFAUT);
  const lignes: LigneAmortissement[] = reglage?.detaille
    ? (reglage.elements ?? [])
        .filter((e) => (e.montant ?? 0) > 0)
        .map((e) => ({
          libelle: e.libelle,
          montant: e.montant ?? 0,
          duree: duree(e.duree),
          annuel: (e.montant ?? 0) / duree(e.duree),
        }))
    : (reglage?.montant ?? 0) > 0
      ? [
          {
            libelle: '',
            montant: reglage?.montant ?? 0,
            duree: duree(reglage?.duree),
            annuel: (reglage?.montant ?? 0) / duree(reglage?.duree),
          },
        ]
      : [];
  const annuel = Math.round(lignes.reduce((t, l) => t + l.annuel, 0) * 100) / 100;
  const total = Math.round(lignes.reduce((t, l) => t + l.montant, 0) * 100) / 100;
  return { inclure: !!reglage?.inclure && annuel > 0, total, annuel, lignes };
}
