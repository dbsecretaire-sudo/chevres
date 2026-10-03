import type { Facture } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE, TYPE_ALIMENT } from '@/shared/constants/comptabilite';

/**
 * Part du montant d'une facture qui n'est pas de catégorie « Autre » : 0 si la facture entière est
 * catégorisée « Autre » (dépense ou recette) ; pour une facture « Alimentation », le montant total
 * moins les lignes elles-mêmes de type « Autre » (une facture peut regrouper plusieurs aliments,
 * certains catégorisés, d'autres non) ; sinon le montant complet. Sert à exclure « Autre » — non
 * représentatif de la santé financière de l'activité — des soldes, sans jamais changer le montant
 * réel affiché sur la facture elle-même.
 */
export function montantAlimentationHorsAutre(f: Facture): number {
  if (f.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION) {
    const partAutre = (f.lignesAlimentation ?? [])
      .filter((l) => l.type === TYPE_ALIMENT.AUTRE)
      .reduce((s, l) => s + l.montant, 0);
    return f.montant - partAutre;
  }
  return f.montant;
}
