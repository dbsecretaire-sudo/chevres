import type { Vente } from '@/features/comptabilite/types';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { capitaliser, especeCourante, vocabulaire } from '@/shared/dictionnaire/animaux';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';

/**
 * Libellé du produit vendu. La vente de petits (cabris, agneaux, veaux…) prend le mot de l'espèce de la
 * vente elle-même, pas de l'espèce affichée en ce moment.
 */
export function libelleCategorieVente(v: Pick<Vente, 'categorie' | 'activite'>): string {
  if (v.categorie !== CATEGORIE_VENTE.CABRIS) return LABEL_CATEGORIE_VENTE[v.categorie];
  const activite = activiteVente(v);
  const espece = activite === ACTIVITE_COMMUNE ? especeCourante() : activite;
  return capitaliser(vocabulaire(espece).petit.pluriel);
}
