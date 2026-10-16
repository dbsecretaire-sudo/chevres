import type { Chevre } from '@/features/cheptel/types';
import type { Vente } from '@/features/comptabilite/types';
import {
  effectifApres,
  suiviMouvements,
  type LibellesSuivi,
} from '@/features/cheptel/services/suiviMouvements';
import { yearOf } from '@/shared/utils/dates';

/**
 * Le nombre de caprins que la déclaration d'estive compte au jour de la montée : les animaux de plus d'un an ou, pour une femelle, ayant
 * mis bas (les mêmes que les femelles éligibles et les mâles du suivi des mouvements). Les jeunes ne comptent pas. Calculé d'après les
 * naissances, ventes et morts jusqu'à cette date incluse.
 */
export function effectifALaMontee(
  animaux: Chevre[],
  ventes: Vente[],
  date: string,
  libelles: LibellesSuivi,
): number {
  const suivi = suiviMouvements(animaux, ventes, yearOf(date), libelles);
  const effectif = effectifApres(
    suivi.effectifDebut,
    suivi.lignes.filter((l) => l.date <= date),
  );
  return effectif.femelles + effectif.males;
}

/**
 * Le code postal et la commune d'une adresse écrite sur plusieurs lignes (« Lieu-dit Pianella⏎20250 Corte ») : ceux de la dernière ligne qui
 * commence par cinq chiffres. Vides quand l'adresse n'en donne pas.
 */
export function codePostalEtCommune(adresse: string | undefined): { codePostal: string; commune: string } {
  const lignes = (adresse ?? '').split(/\r?\n|,/).map((l) => l.trim());
  for (let i = lignes.length - 1; i >= 0; i--) {
    const m = /^(\d{5})\s+(.+)$/.exec(lignes[i]);
    if (m) return { codePostal: m[1], commune: m[2].trim() };
  }
  return { codePostal: '', commune: '' };
}
