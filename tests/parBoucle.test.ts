import { describe, expect, it } from 'vitest';
import { parBoucleCroissante } from '@/features/cheptel/utils/chevreLabel';

describe('tri des animaux par boucle croissante', () => {
  it('trie les numéros dans l’ordre croissant, ceux sans boucle à la fin', () => {
    const liste = [
      { numeroBoucle: '00789' },
      { numeroBoucle: '00786' },
      { numeroBoucle: undefined, nom: 'Mimi' },
      { numeroBoucle: '00790' },
      { numeroBoucle: '00788' },
    ];
    expect([...liste].sort(parBoucleCroissante).map((a) => a.numeroBoucle ?? a.nom)).toEqual(['00786', '00788', '00789', '00790', 'Mimi']);
  });
});
