import { afterEach, describe, expect, it } from 'vitest';
import {
  categoriesClientParDefaut,
  definirCategoriesClient,
  fraisAbattoirFactures,
} from '@/shared/dictionnaire/categoriesClient';
import { fraisAbattoirFacturesAuClient, fraisAbattoirMemeOfferts } from '@/features/clients/services/categorie';

describe('frais d’abattoir facturés selon la catégorie du contact', () => {
  afterEach(() => definirCategoriesClient(undefined));

  it('d’office : oui, sauf à prix libre (récolteur)', () => {
    expect(fraisAbattoirFactures({ prixLibre: false })).toBe(true);
    expect(fraisAbattoirFactures({ prixLibre: true })).toBe(false);
    expect(fraisAbattoirFactures(undefined)).toBe(true);
  });

  it('le réglage de la catégorie l’emporte, dans les deux sens', () => {
    expect(fraisAbattoirFactures({ prixLibre: true, fraisAbattoir: true })).toBe(true);
    expect(fraisAbattoirFactures({ prixLibre: false, fraisAbattoir: false })).toBe(false);
  });

  it('pour un contact : sa catégorie décide ; une vente offerte n’en a que si la catégorie les facture expressément', () => {
    const categories = categoriesClientParDefaut().map((c) => (c.prixLibre ? { ...c, id: 'elevage', nom: 'Élevage' } : c));
    definirCategoriesClient([...categories, { id: 'ferme', nom: 'Ferme', declaree: true, prixLibre: true, fraisAbattoir: true }]);

    const recolteur = { categorie: 'elevage' };
    expect(fraisAbattoirFacturesAuClient(recolteur)).toBe(false);
    expect(fraisAbattoirMemeOfferts(recolteur)).toBe(false);

    const ferme = { categorie: 'ferme' };
    expect(fraisAbattoirFacturesAuClient(ferme)).toBe(true);
    expect(fraisAbattoirMemeOfferts(ferme)).toBe(true);

    // Un particulier (d'office) : oui, mais pas pour une vente offerte tant que le réglage n'est pas coché.
    const particulier = { categorie: 'particulier' };
    expect(fraisAbattoirFacturesAuClient(particulier)).toBe(true);
    expect(fraisAbattoirMemeOfferts(particulier)).toBe(false);
  });
});
