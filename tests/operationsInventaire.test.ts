import { describe, expect, it } from 'vitest';
import {
  depensesDesOperations,
  groupesRecetteDesOperations,
  idOperation,
  libelleOperation,
  operationsDeLaRubrique,
  operationsDesDepenses,
  operationsDesRecettes,
  type RubriqueOperations,
} from '@/features/contacts/services/operationsInventaire';

const rubriques: RubriqueOperations[] = [
  { categorie: 'produits_finis', titre: 'Produits finis', listes: [{ cle: 'fromages', titre: 'Fromages' }, { cle: 'lait', titre: 'Lait' }, { cle: 'perso:abc', titre: 'Laine, Peaux' }] },
  { categorie: 'produits_animaux', titre: 'Produits animaux', listes: [{ cle: 'animaux', titre: 'Animaux' }] },
  { categorie: 'matieres_premieres', titre: 'Matières premières', listes: [{ cle: 'aliments', titre: 'Aliments' }, { cle: 'boucles', titre: 'Boucles' }] },
];

describe('opérations d’une catégorie de contact', () => {
  it('chaque liste a sa vente et son achat', () => {
    expect(operationsDeLaRubrique(rubriques[1])).toEqual(['produits_animaux:animaux:vente', 'produits_animaux:animaux:achat']);
    expect(operationsDeLaRubrique(rubriques[1], 'achat')).toEqual(['produits_animaux:animaux:achat']);
    expect(idOperation('produits_finis', 'fromages', 'vente')).toBe('produits_finis:fromages:vente');
    expect(libelleOperation('achat', 'Animaux')).toBe('Achat - Animaux');
  });

  it('les opérations ouvrent les catégories de dépense (animaux vivants, alimentation, fournitures)', () => {
    expect(depensesDesOperations(['produits_animaux:animaux:achat', 'matieres_premieres:aliments:achat', 'matieres_premieres:boucles:vente'])).toEqual([
      'animaux_vivants',
      'alimentation',
      'production',
    ]);
  });

  it('les opérations ouvrent les groupes de recette (une liste ajoutée tombe dans « autre »)', () => {
    expect(
      groupesRecetteDesOperations(['produits_finis:fromages:vente', 'produits_animaux:animaux:vente', 'produits_finis:perso:abc:vente']),
    ).toEqual(['fromages', 'viande', 'autre']);
  });

  it('des dépenses ou des recettes déjà réglées donnent les opérations correspondantes', () => {
    expect(operationsDesDepenses(['animaux_vivants', 'alimentation', 'carburant'], rubriques)).toEqual([
      'produits_animaux:animaux:achat',
      'matieres_premieres:aliments:achat',
    ]);
    expect(operationsDesRecettes(['fromages', 'viande', 'aide'], rubriques)).toEqual([
      'produits_finis:fromages:vente',
      'produits_animaux:animaux:vente',
    ]);
  });
});
