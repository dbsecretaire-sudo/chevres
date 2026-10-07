import type { Chevre } from '@/features/cheptel/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, roleDeLaViande, type FiltreStock } from '@/features/stock/services/stock';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { GENRE_ARTICLE, type ROLE_VIANDE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
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

/**
 * Le rôle de la ligne de viande qu'une vente a choisie comme détail (les petits, l'animal sur pied, l'animal vivant) ; rien pour
 * la charcuterie et les autres lignes. Une vente de ces lignes se fait animal par animal : elle désigne ses fiches du cheptel.
 */
export async function roleDuDetailDeVente(
  activite: string,
  precision: string | undefined,
): Promise<ValeurDe<typeof ROLE_VIANDE> | undefined> {
  if (!precision) return undefined;
  const archive = await lireArchiveStock();
  const filtre = activite === ACTIVITE_COMMUNE ? undefined : (activite as FiltreStock);
  const ligne = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, filtre).find((a) => a.libelle === precision);
  return ligne ? roleDeLaViande(ligne.cle) : undefined;
}
