import { describe, expect, it } from 'vitest';
import {
  avecContrat,
  contratDuNumero,
  contratsDe,
  estUnAssureur,
  numeroDuContrat,
  sansContrat,
} from '@/features/fournisseurs/services/contratsAssureur';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_FOURNISSEUR, CATEGORIES_ASSOCIATION } from '@/shared/constants/fournisseurs';
import { categoriesFournisseurParDefaut } from '@/shared/dictionnaire/categoriesFournisseur';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';

const assureur = (extra: Partial<Fournisseur> = {}): Fournisseur => ({
  id: 'a1',
  nom: '',
  nomEntreprise: 'Groupama',
  siret: '',
  adressePostale: '',
  categorie: CATEGORIE_FOURNISSEUR.ASSUREUR,
  ...extra,
});

describe('contrats d’un assureur', () => {
  it('seul un fournisseur de catégorie assureur a des contrats', () => {
    expect(estUnAssureur(assureur())).toBe(true);
    expect(estUnAssureur(assureur({ categorie: CATEGORIE_FOURNISSEUR.GARAGE }))).toBe(false);
    expect(estUnAssureur(undefined)).toBe(false);
  });

  it('un contrat s’ajoute, se modifie et se supprime ; la liste est par ordre alphabétique', () => {
    let f = avecContrat(assureur(), { denomination: 'Véhicule 4x4', numero: '777' });
    f = avecContrat(f, { denomination: 'Multirisque', numero: '123' });
    expect(contratsDe(f).map((c) => c.denomination)).toEqual(['Multirisque', 'Véhicule 4x4']);
    const id = f.contrats![0].id;
    f = avecContrat(f, { id, denomination: 'Véhicule 4x4', numero: '888', vehiculeId: 'v1' });
    expect(f.contrats).toHaveLength(2);
    expect(f.contrats!.find((c) => c.id === id)).toMatchObject({ numero: '888', vehiculeId: 'v1' });
    f = sansContrat(f, id);
    expect(f.contrats).toHaveLength(1);
  });

  it('le numéro de la facture est celui du contrat (à défaut, sa dénomination) et retrouve le contrat', () => {
    const f = avecContrat(avecContrat(assureur(), { denomination: 'Multirisque', numero: ' 123 ' }), {
      denomination: 'Sans numéro',
      numero: '',
    });
    expect(numeroDuContrat(f.contrats![0])).toBe('123');
    expect(numeroDuContrat(f.contrats![1])).toBe('Sans numéro');
    expect(contratDuNumero(f, '123')?.denomination).toBe('Multirisque');
    expect(contratDuNumero(f, 'sans numéro')?.denomination).toBe('Sans numéro');
    expect(contratDuNumero(f, 'autre')).toBeUndefined();
    expect(contratDuNumero(f, '')).toBeUndefined();
  });
});

describe('catégories de contacts ajoutées', () => {
  it('l’association, la coopérative et le comptable sont proposés d’office ; l’ancien groupement reste lié au lieu', () => {
    const ids = categoriesFournisseurParDefaut().map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        CATEGORIE_FOURNISSEUR.ASSOCIATION_AGRICOLE,
        CATEGORIE_FOURNISSEUR.COOPERATIVE_AGRICOLE,
        CATEGORIE_FOURNISSEUR.COMPTABLE,
      ]),
    );
    expect(CATEGORIES_ASSOCIATION).toEqual(
      expect.arrayContaining([CATEGORIE_FOURNISSEUR.ASSOCIATION_AGRICOLE, CATEGORIE_FOURNISSEUR.COOPERATIVE_AGRICOLE, CATEGORIE_FOURNISSEUR.GROUPEMENT]),
    );
  });

  it('les frais bancaires s’appellent frais bancaires et comptables', () => {
    expect(LABEL_CATEGORIE_DEPENSE[CATEGORIE_DEPENSE.FRAIS_BANCAIRES]).toBe('Frais bancaires et comptables');
  });
});
