import { describe, expect, it } from 'vitest';
import { fusionner, type RapportFusion } from '@/features/drive/fusion';

const rapport = (): RapportFusion => ({ ajoutes: 0, conflits: 0 });

describe('fusion des données de deux appareils', () => {
  it('les éléments à identifiant des deux côtés s’additionnent', () => {
    const r = rapport();
    const fusion = fusionner(
      [{ id: 'a', montant: 10 }, { id: 'b', montant: 20 }],
      [{ id: 'b', montant: 20 }, { id: 'c', montant: 30 }],
      r,
    ) as { id: string }[];
    expect(fusion.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(r).toEqual({ ajoutes: 1, conflits: 0 });
  });

  it('un élément modifié des deux côtés garde ce que chacun a de plus ; sur une valeur différente, le local l’emporte', () => {
    const r = rapport();
    const fusion = fusionner(
      [{ id: 'a', tiers: 'Garage', montant: 100 }],
      [{ id: 'a', tiers: 'Garage Martin', montant: 100, motif: 'freins' }],
      r,
    ) as Record<string, unknown>[];
    expect(fusion).toEqual([{ id: 'a', tiers: 'Garage', montant: 100, motif: 'freins' }]);
    expect(r.conflits).toBe(1);
  });

  it('un champ vide d’un côté vient de l’autre, et un champ vide ne vient pas effacer une valeur', () => {
    expect(fusionner({ a: '', b: 'x', c: 3 }, { a: 'y', b: '', c: 3 })).toEqual({ a: 'y', b: 'x', c: 3 });
  });

  it('les listes de textes se réunissent sans doublon, dans l’ordre du local d’abord', () => {
    expect(fusionner({ vues: ['x', 'y'] }, { vues: ['y', 'z'] })).toEqual({ vues: ['x', 'y', 'z'] });
  });

  it('les tableaux d’objets sans identifiant ne sont pas dupliqués', () => {
    const fusion = fusionner([{ nom: 'a' }], [{ nom: 'a' }, { nom: 'b' }]) as unknown[];
    expect(fusion).toHaveLength(2);
  });

  it('les objets se fusionnent champ par champ, en profondeur (un stock : mouvements, prix, noms)', () => {
    const local = { mouvements: [{ id: 'm1', delta: 2 }], prix: { 'fromage:frais': 8 }, noms: { x: 'A' } };
    const distant = { mouvements: [{ id: 'm2', delta: -1 }], prix: { 'fromage:frais': 9, 'fromage:crottin': 5 }, noms: { y: 'B' } };
    const r = rapport();
    expect(fusionner(local, distant, r)).toEqual({
      mouvements: [
        { id: 'm1', delta: 2 },
        { id: 'm2', delta: -1 },
      ],
      prix: { 'fromage:frais': 8, 'fromage:crottin': 5 },
      noms: { x: 'A', y: 'B' },
    });
    expect(r).toEqual({ ajoutes: 1, conflits: 1 });
  });

  it('sans l’un des deux côtés, l’autre reste tel quel', () => {
    expect(fusionner(undefined, [{ id: 'a' }])).toEqual([{ id: 'a' }]);
    expect(fusionner([{ id: 'a' }], undefined)).toEqual([{ id: 'a' }]);
  });
});
