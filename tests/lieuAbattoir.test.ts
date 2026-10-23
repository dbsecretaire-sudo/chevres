import { describe, expect, it } from 'vitest';
import { ecrituresDuLieu, LIEUX_TIERS } from '@/features/accueil/services/lieuxTiers';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';

const ecriture = (titre: string, categorie?: string, libelleCategorie?: string) => ({ titre, categorie, libelleCategorie });

describe('écritures de l’abattoir', () => {
  const libelle = (c: string) => (c === 'viande' ? 'Viande' : c);
  const ecritures = [
    ecriture('Abattoir de Corte', CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE),
    ecriture('Restaurant du port', undefined, 'Viande'),
    ecriture('Abattoir de Corte', undefined, 'Viande'),
    ecriture('Garage Martin', CATEGORIE_DEPENSE.AUTRE),
  ];

  it('les viandes vendues aux clients n’y sont pas, seules les écritures passées par l’abattoir y figurent', () => {
    const lieu = ecrituresDuLieu(LIEUX_TIERS.abattoir, ecritures, ['Abattoir de Corte'], libelle);
    expect(lieu.map((e) => e.titre)).toEqual(['Abattoir de Corte', 'Abattoir de Corte']);
    expect(lieu.some((e) => e.titre === 'Restaurant du port')).toBe(false);
  });
});
