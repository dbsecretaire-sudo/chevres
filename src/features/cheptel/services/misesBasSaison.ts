import type { Chevre } from '@/features/cheptel/types';
import { DERNIER_MOIS_PREMIER_SEMESTRE, PREMIER_MOIS_SECOND_SEMESTRE } from '@/shared/constants/cheptel';

/** Les dates de naissance des petits d'une mère, pour les deux semestres de la saison : les tardifs (2e semestre de l'année d'avant) et le 1er semestre de l'année. */
export interface MisesBasDeLaSaison {
  tardifs: string[];
  premierSemestre: string[];
}

/**
 * Les mises bas de la saison d'une année, par mère (son n° de boucle) : le 2e semestre de l'année précédente (tardifs) et le 1er semestre de l'année.
 * Chaque date est donnée une fois, de la plus ancienne à la plus récente. Une mère sans mise bas dans la saison n'apparaît pas.
 */
export function misesBasDeLaSaison(cheptel: readonly Chevre[], annee: number): Record<string, MisesBasDeLaSaison> {
  const resultat: Record<string, MisesBasDeLaSaison> = {};
  const ajouter = (liste: string[], date: string) => {
    if (!liste.includes(date)) liste.push(date);
    liste.sort();
  };
  for (const c of cheptel) {
    if (!c.mereNumeroBoucle || !c.dateNaissance) continue;
    const an = Number(c.dateNaissance.slice(0, 4));
    const mois = Number(c.dateNaissance.slice(5, 7));
    const tardif = an === annee - 1 && mois >= PREMIER_MOIS_SECOND_SEMESTRE;
    const premier = an === annee && mois <= DERNIER_MOIS_PREMIER_SEMESTRE;
    if (!tardif && !premier) continue;
    const entree = (resultat[c.mereNumeroBoucle] ??= { tardifs: [], premierSemestre: [] });
    ajouter(tardif ? entree.tardifs : entree.premierSemestre, c.dateNaissance);
  }
  return resultat;
}
