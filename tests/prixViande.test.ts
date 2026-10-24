import { describe, expect, it } from 'vitest';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import type { ArchiveStock } from '@/features/stock/types';
import { cleLigneDeViande, detailEtPrixDeLaVente, roleDeLAnimalVendu, totalDeLAnimal } from '@/features/production/simple/prixViande';

const CHEVRES = TYPE_ANIMAL_ETABLISSEMENT.CHEVRES;

describe('le prix d’un animal vendu d’après l’inventaire', () => {
  it('un petit se vend au kilo, un adulte mort aussi, un adulte vivant à la tête', () => {
    expect(roleDeLAnimalVendu(true, 'morts')).toBe('jeune');
    expect(roleDeLAnimalVendu(true, 'vivants')).toBe('jeune');
    expect(roleDeLAnimalVendu(false, 'morts')).toBe('pied');
    expect(roleDeLAnimalVendu(false, 'vivants')).toBe('vivant');
  });

  it('le total est le poids × le prix du kilo, arrondi au centime', () => {
    expect(totalDeLAnimal(12.5, 'jeune', 8)).toBe(100);
    expect(totalDeLAnimal(11.33, 'pied', 8.5)).toBe(96.31);
  });

  it('sans poids, un kilo ; à la tête, le prix de l’animal', () => {
    expect(totalDeLAnimal(12, 'jeune', undefined)).toBe(12);
    expect(totalDeLAnimal(150, 'vivant', 40)).toBe(150);
  });

  it('rien quand l’inventaire n’a pas de prix', () => {
    expect(totalDeLAnimal(undefined, 'jeune', 8)).toBeUndefined();
    expect(totalDeLAnimal(0, 'jeune', 8)).toBeUndefined();
  });

  it('la ligne de l’inventaire porte l’espèce et le rôle', () => {
    expect(cleLigneDeViande('chevres', 'jeune')).toBe('viande:chevres_jeune');
  });

  it('la vente garde le détail de la ligne et, si le prix change, son prix unitaire', () => {
    const archive = { articles: [], noms: {}, ordres: {}, mouvements: [], prix: { [cleLigneDeViande(CHEVRES, 'jeune')]: 8 } } as unknown as ArchiveStock;
    const ligne = detailEtPrixDeLaVente(archive, CHEVRES, 'jeune', 64, 8);
    expect(ligne.precision).toBeTruthy();
    expect(ligne.prixUnitairePersonnalise).toBeUndefined();
    expect(detailEtPrixDeLaVente(archive, CHEVRES, 'jeune', 80, 8).prixUnitairePersonnalise).toBe(10);
  });
});
