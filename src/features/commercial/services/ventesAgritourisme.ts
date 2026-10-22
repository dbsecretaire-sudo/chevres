import { montantVisite } from '@/features/commercial/services/agritourisme';
import type { VisiteAgritourisme } from '@/features/commercial/types';
import type { Vente } from '@/features/comptabilite/types';
import { STATUT_VISITE } from '@/shared/constants/agritourisme';

/** L'unité des ventes de l'agritourisme : des personnes (le mot court s'affiche tel quel dans les chiffres). */
const UNITE_PERSONNES = 'pers.';

/**
 * Les ventes de l'agritourisme : les visites réalisées, chacune vue comme une vente (la formule pour produit, le nombre de personnes pour quantité, le groupe
 * pour client). Les visites à venir ou annulées n'ont rien rapporté : elles n'y sont pas. Avec `annee`, seulement celles de cette année.
 */
export function ventesDesVisites(visites: readonly VisiteAgritourisme[], annee?: number): Vente[] {
  return visites
    .filter((v) => v.statut === STATUT_VISITE.REALISEE && (annee === undefined || v.date.startsWith(String(annee))))
    .map(
      (v) =>
        ({
          id: v.id,
          date: v.date,
          categorie: 'visite',
          quantite: v.participants,
          unite: UNITE_PERSONNES,
          prix: montantVisite(v),
          client: v.client,
          precision: v.formule,
          payee: v.enAttente ? false : undefined,
          echeance: v.enAttente ? v.echeance : undefined,
        }) as unknown as Vente,
    );
}

/** Le produit d'une vente de l'agritourisme : sa formule (les visites d'une même formule se regroupent). */
export const produitDeLaVisite = (v: Pick<Vente, 'precision'>): { cle: string; libelle: string } => ({
  cle: v.precision ?? '',
  libelle: v.precision ?? '',
});
