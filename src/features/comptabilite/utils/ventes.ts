import type { Vente } from '@/features/comptabilite/types';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { CATEGORIE_VENTE, SEPARATEUR_ANIMAUX, TYPE_CHOIX_FACTURE } from '@/shared/constants/comptabilite';
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

/** Les identifiants des fiches du cheptel des animaux d'une vente (aucun pour une vente sans animal choisi). */
export const idsDesAnimaux = (vente: Pick<Vente, 'animaux'>): string[] =>
  vente.animaux ? vente.animaux.split(SEPARATEUR_ANIMAUX).filter(Boolean) : [];

/** Vrai quand le client souhaite que la vente soit déclarée (avec facture) : d'office, et pour les ventes d'avant ce choix. */
export const venteADeclarer = (vente: Pick<Vente, 'choixFacture'>): boolean =>
  vente.choixFacture !== TYPE_CHOIX_FACTURE.SANS_FACTURE;
