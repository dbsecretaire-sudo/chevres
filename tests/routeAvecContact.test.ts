import { describe, expect, it } from 'vitest';
import { routeAvecContact } from '@/features/accueil/services/routeAvecContact';
import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';

const fournisseur = { id: 'f1' } as Fournisseur;
const client = { id: 'c1' } as Client;

describe('la nouvelle écriture d’un intervenant', () => {
  it('une dépense s’ouvre avec son fournisseur, une recette avec son client', () => {
    expect(routeAvecContact('/comptabilite/nouvelle?type=recue&depense=reparation', { fournisseur })).toBe(
      '/comptabilite/nouvelle?type=recue&depense=reparation&fournisseur=f1',
    );
    expect(routeAvecContact('/comptabilite/nouvelle?type=emise', { client })).toBe('/comptabilite/nouvelle?type=emise&client=c1');
  });

  it('un intervenant client et fournisseur : seul ce que le type demande est choisi', () => {
    expect(routeAvecContact('/comptabilite/nouvelle?type=recue', { client, fournisseur })).toBe('/comptabilite/nouvelle?type=recue&fournisseur=f1');
    expect(routeAvecContact('/comptabilite/nouvelle?type=emise', { client, fournisseur })).toBe('/comptabilite/nouvelle?type=emise&client=c1');
  });

  it('sans type dans l’adresse, ce qu’est l’intervenant ; sans intervenant, l’adresse telle quelle', () => {
    expect(routeAvecContact('/comptabilite/nouvelle', { fournisseur })).toBe('/comptabilite/nouvelle?fournisseur=f1');
    expect(routeAvecContact('/comptabilite/nouvelle?type=recue')).toBe('/comptabilite/nouvelle?type=recue');
  });
});
