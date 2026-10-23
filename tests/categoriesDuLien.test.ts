import { describe, expect, it } from 'vitest';
import { categoriesDuLien, deCesCategories, lienPourCategories } from '@/features/commercial/services/categoriesDuLien';

const clients = [
  { id: 'a', nom: 'Dupont', prenom: 'Marie', categorie: 'particulier' },
  { id: 'b', nom: 'Carrefour', categorie: 'surface_commerciale' },
  { id: 'c', nom: 'Bistrot', categorie: 'entreprise' },
];

describe('pages du commerce triées par catégorie de contact', () => {
  it('le lien porte les catégories, la page les relit', () => {
    const lien = lienPourCategories('/commercial/ventes', ['entreprise', 'surface_commerciale']);
    expect(lien).toBe('/commercial/ventes?categorie=entreprise,surface_commerciale');
    expect(categoriesDuLien('entreprise,surface_commerciale')).toEqual(['entreprise', 'surface_commerciale']);
    expect(categoriesDuLien(undefined)).toBeUndefined();
    expect(lienPourCategories('/commercial/ventes', [])).toBe('/commercial/ventes');
  });

  it('ne garde que les ventes des contacts de la catégorie (par fiche, ou par nom)', () => {
    const ventes = [
      { client: 'Dupont Marie' },
      { client: 'Carrefour' },
      { clientId: 'c', client: 'Autre nom' },
      { client: 'Inconnu' },
    ];
    expect(deCesCategories(ventes, clients, ['particulier'])).toEqual([{ client: 'Dupont Marie' }]);
    expect(deCesCategories(ventes, clients, ['entreprise', 'surface_commerciale'])).toHaveLength(2);
    expect(deCesCategories(ventes, clients, undefined)).toHaveLength(4);
  });
});
