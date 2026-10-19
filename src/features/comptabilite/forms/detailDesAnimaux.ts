import type { Chevre } from '@/features/cheptel/types';
import type { ArchiveStock } from '@/features/stock/types';
import { articlesDuGenre, roleDeLaViande } from '@/features/stock/services/stock';
import { GENRE_ARTICLE, ROLE_VIANDE } from '@/shared/constants/stock';
import { agePetitMax } from '@/shared/constants/cheptel';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { ageAtteint } from '@/shared/utils/age';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import { numerosTiptag } from '@/features/stock/services/boucles';

/**
 * Le détail de la vente d'animaux d'un bon d'après leur âge à la date de la facture : « Cabris » pour des petits, sinon la ligne des
 * adultes (vivants s'ils sont remis vivants, sinon sur pied). `petits` dit si tous les animaux sont des petits (un tiptag en est un).
 */
export function detailDesAnimaux(
  choisis: Chevre[],
  etat: 'vivants' | 'morts' | undefined,
  jour: string,
  archive: ArchiveStock,
): { libelle?: string; petits: boolean } {
  // Un tiptag est destiné à l'abattoir : c'est un cabri, quel que soit son âge le jour de la facture.
  const tiptags = numerosTiptag(archive.boucles);
  const petits = choisis.length > 0 && choisis.every((a) => !ageAtteint(a.dateNaissance, agePetitMax(), jour) || estTiptag(a, tiptags));
  const role = petits ? ROLE_VIANDE.JEUNE : etat === 'vivants' ? ROLE_VIANDE.VIVANT : ROLE_VIANDE.SUR_PIED;
  const ligne = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, especeCourante()).find((a) => roleDeLaViande(a.cle) === role);
  return { libelle: ligne?.libelle, petits };
}
