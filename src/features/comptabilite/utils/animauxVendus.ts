import type { Chevre } from '@/features/cheptel/types';
import { SEXE } from '@/shared/constants/cheptel';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

/**
 * L'animal d'une vente tel qu'on le lit dans les listes : son n° de boucle (ou son nom, ou « sans boucle » pour un petit pas
 * encore bouclé), M ou F, puis sa date de naissance — une seule fois.
 */
export function libelleAnimalVendu(
  a: Pick<Chevre, 'numeroBoucle' | 'nom' | 'sexe' | 'dateNaissance'>,
): string {
  const identifiant = a.numeroBoucle
    ? a.nom
      ? `${a.numeroBoucle} — ${a.nom}`
      : a.numeroBoucle
    : a.nom
      ? T.sansBoucleNom(a.nom)
      : T.sansBoucle;
  return T.animalOption(identifiant, a.sexe === SEXE.MALE ? T.sexeM : T.sexeF, formatDateFR(a.dateNaissance));
}
