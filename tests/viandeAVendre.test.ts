import { describe, expect, it } from 'vitest';
import { animauxSansBoucleAVendre } from '@/features/production/simple/viandeAVendre';
import type { Chevre } from '@/features/cheptel/types';

const animal = (id: string, extra: Partial<Chevre>): Chevre =>
  ({ id, dateNaissance: '2026-01-01', statut: 'vivante', ...extra }) as Chevre;

describe('la viande à vendre : les chèvres sans boucle', () => {
  it('ne garde que les animaux sans boucle, vivants ou à l’abattoir, pas encore vendus', () => {
    const liste = [
      animal('a', {}),
      animal('b', { numeroBoucle: '12345' }),
      animal('c', { statut: 'abattoir' as Chevre['statut'] }),
      animal('d', { statut: 'morte' as Chevre['statut'] }),
      animal('e', {}),
    ];
    expect(animauxSansBoucleAVendre(liste, new Set(['e'])).map((a) => a.id).sort()).toEqual(['a', 'c']);
  });

  it('le plus récent d’abord', () => {
    const liste = [animal('vieux', { dateNaissance: '2025-01-01' }), animal('jeune', { dateNaissance: '2026-03-01' })];
    expect(animauxSansBoucleAVendre(liste, new Set()).map((a) => a.id)).toEqual(['jeune', 'vieux']);
  });
});

describe('l’âge d’un animal en jours', () => {
  it('compte les jours entiers depuis la naissance', async () => {
    const { joursDeVie } = await import('@/features/production/simple/viandeAVendre');
    expect(joursDeVie('2026-10-01', '2026-10-24')).toBe(23);
    expect(joursDeVie('2026-10-24', '2026-10-24')).toBe(0);
  });

  it('ne dit rien sans date de naissance ou pour une naissance dans le futur', async () => {
    const { joursDeVie } = await import('@/features/production/simple/viandeAVendre');
    expect(joursDeVie(undefined, '2026-10-24')).toBeUndefined();
    expect(joursDeVie('2026-11-01', '2026-10-24')).toBeUndefined();
  });
});
