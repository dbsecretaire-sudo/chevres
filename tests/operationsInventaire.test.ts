import { describe, expect, it } from 'vitest';
import {
  depensesDesOperations,
  estPermiseEnDepense,
  groupesRecetteDesOperations,
  idOperation,
  libelleOperation,
  operationsDeLaRubrique,
  operationsDesDepenses,
  operationsDesRecettes,
  sensDansLesDepenses,
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

describe('les dépenses et la vente d’animaux', () => {
  it('les dépenses ne comptent que des achats, sauf la vente d’animaux (vers l’abattoir)', () => {
    expect(sensDansLesDepenses('produits_animaux', 'animaux')).toEqual(['achat', 'vente']);
    expect(sensDansLesDepenses('produits_finis', 'fromages')).toEqual(['achat']);
    expect(estPermiseEnDepense('produits_animaux:animaux:vente')).toBe(true);
    expect(estPermiseEnDepense('produits_finis:fromages:vente')).toBe(false);
    expect(estPermiseEnDepense('matieres_premieres:aliments:achat')).toBe(true);
    expect(depensesDesOperations(['produits_animaux:animaux:vente'].filter(estPermiseEnDepense))).toEqual(['animaux_vivants']);
  });
});
