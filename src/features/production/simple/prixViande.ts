import type { ArchiveStock } from '@/features/stock/types';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { cleArticle, lignesDeVenteDeProduits } from '@/features/stock/services/stock';
import { GENRE_ARTICLE, ROLE_VIANDE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';

type RoleViande = ValeurDe<typeof ROLE_VIANDE>;

/**
 * La ligne de viande de l'inventaire qui fixe le prix d'un animal vendu : un petit (cabri, agneau…) est vendu au kilo sur sa ligne des petits ; un adulte mort, au kilo sur la ligne
 * « sur pied » ; un adulte vivant, à la tête sur la ligne « vivant ».
 */
export function roleDeLAnimalVendu(petit: boolean, etat: 'vivants' | 'morts'): RoleViande {
  if (petit) return ROLE_VIANDE.JEUNE;
  return etat === 'vivants' ? ROLE_VIANDE.VIVANT : ROLE_VIANDE.SUR_PIED;
}

/** L'identifiant, dans l'inventaire, de la ligne de viande d'une espèce pour ce rôle. */
export const cleLigneDeViande = (espece: string, role: RoleViande): string =>
  cleArticle(GENRE_ARTICLE.VIANDE, `${espece}_${role}`);

/** Vrai quand le prix de cette ligne se compte au kilo (les petits et les animaux sur pied) ; sinon, à la tête. */
export const prixAuKilo = (role: RoleViande): boolean => role !== ROLE_VIANDE.VIVANT;

/**
 * Le prix total d'un animal d'après le prix de l'inventaire : le poids × le prix du kilo (1 kg tant que le poids n'est pas connu, comme dans la vente), ou le prix de la tête.
 * Rien quand l'inventaire n'a pas de prix.
 */
export function totalDeLAnimal(prixUnitaire: number | undefined, role: RoleViande, poidsKg: number | undefined): number | undefined {
  if (!prixUnitaire || prixUnitaire <= 0) return undefined;
  const multiplicateur = prixAuKilo(role) ? poidsKg || 1 : 1;
  return Math.round(prixUnitaire * multiplicateur * 100) / 100;
}

/** Le détail d'une vente de viande (l'intitulé de la ligne de l'inventaire) et, quand le prix choisi n'est pas celui de l'inventaire, le prix unitaire à garder pour que la fiche de la vente retrouve son total. */
export function detailEtPrixDeLaVente(
  archive: ArchiveStock,
  espece: EspeceAnimale,
  role: RoleViande,
  total: number,
  poidsKg: number | undefined,
): { precision?: string; prixUnitairePersonnalise?: number } {
  const cle = cleLigneDeViande(espece, role);
  const precision = lignesDeVenteDeProduits(archive, espece).find((a) => a.cle === cle)?.libelle;
  if (!precision) return {};
  if (totalDeLAnimal(archive.prix[cle], role, poidsKg) === total) return { precision };
  const multiplicateur = prixAuKilo(role) ? poidsKg || 1 : 1;
  return { precision, prixUnitairePersonnalise: total / multiplicateur };
}
