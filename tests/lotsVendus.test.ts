import { describe, expect, it } from 'vitest';
import {
  animauxChangesDeSorte,
  lotsVendusManquants,
  nombreDAnimauxVendus,
  ventesDuLotVendus,
} from '@/features/exploitation/services/lotsVendus';
import { effectifsDesAnimaux } from '@/features/cheptel/repository/chevres';
import { niveauxDeStock } from '@/features/stock/services/stock';
import type { Chevre } from '@/features/cheptel/types';
import type { Vente } from '@/features/comptabilite/types';

const bete = (id: string, extra: Partial<Chevre> = {}): Chevre =>
  ({ id, espece: 'chevres', sexe: 'M', statut: 'morte', dateStatut: '2026-03-01', dateNaissance: '2026-01-01', ...extra }) as unknown as Chevre;
const vente = (id: string, animaux: string, extra: Partial<Vente> = {}): Vente =>
  ({ id, categorie: 'viande', date: '2026-03-01', choixFacture: 'sans_facture', animaux, prix: 50, ...extra }) as unknown as Vente;

describe('animaux sans boucle vendus sans facture : lots morts et vivants', () => {
  it('les deux lots existent toujours (créés une fois, dans « Autres lots »)', () => {
    let n = 0;
    const lots = lotsVendusManquants([], () => `id${++n}`)!;
    expect(lots.map((l) => [l.nom, l.vendus, l.categorie])).toEqual([
      ['Animaux vendus morts', 'morts', undefined],
      ['Animaux vendus vivants', 'vivants', undefined],
    ]);
    expect(lotsVendusManquants(lots)).toBeNull();
  });

  it('les ventes se rangent d’après le statut de leurs animaux ; passer d’un côté à l’autre change leurs fiches', () => {
    const animaux = new Map([
      ['a', bete('a')],
      ['b', bete('b', { statut: 'vendue' })],
      ['c', bete('c', { statut: 'abattoir' })],
    ]);
    const ventes = [vente('v1', 'a;c'), vente('v2', 'b'), vente('v3', 'a', { choixFacture: 'avec_facture' } as never)];
    expect(ventesDuLotVendus('morts', ventes, animaux).map((v) => v.id)).toEqual(['v1']);
    expect(ventesDuLotVendus('vivants', ventes, animaux).map((v) => v.id)).toEqual(['v2']);
    expect(nombreDAnimauxVendus('morts', ventes, animaux)).toBe(2);
    // v1 passe en vivants : « a » devient vendue ; en morts : « b » devient morte, « c » reste à l'abattoir.
    expect(animauxChangesDeSorte(ventes[0], 'vivants', animaux).map((x) => [x.id, x.statut])).toEqual([
      ['a', 'vendue'],
      ['c', 'vendue'],
    ]);
    expect(animauxChangesDeSorte(vente('v4', 'b;c'), 'morts', animaux).map((x) => [x.id, x.statut])).toEqual([['b', 'morte']]);
  });

  it('« Animaux adultes vivants » compte les boucs aussi', () => {
    const e = effectifsDesAnimaux([bete('a', { statut: 'vivante', dateNaissance: '2019-01-01' }), bete('m', { statut: 'vivante', dateNaissance: '2019-01-01', sexe: 'F' })]);
    expect(niveauxDeStock([], e).get('viande:chevres_vivant')).toBe(2);
  });
});
