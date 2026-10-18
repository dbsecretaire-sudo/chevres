import { describe, expect, it } from 'vitest';
import { animalAcheteVide, controleDesAnimauxAchetes } from '@/features/comptabilite/forms/animauxAchetes';
import { idsDesAnimauxAchetes } from '@/features/comptabilite/utils/ventes';

const animal = (boucle: string, naissance: string) => ({ ...animalAcheteVide(), boucle, naissance });

describe('animaux vivants achetés', () => {
  it('au moins un animal, chacun avec sa date de naissance', () => {
    expect(controleDesAnimauxAchetes([])).toEqual({ ok: false, erreur: 'aucun' });
    expect(controleDesAnimauxAchetes([animal('1', '')])).toEqual({ ok: false, erreur: 'naissance' });
    expect(controleDesAnimauxAchetes([animal('1', '2024-02-30x')])).toEqual({ ok: false, erreur: 'naissance' });
    expect(controleDesAnimauxAchetes([animal('1', '2024-03-05'), animal('', '2023-01-02')]).ok).toBe(true);
  });

  it('deux animaux ne portent pas la même boucle (sans boucle, c’est permis)', () => {
    expect(controleDesAnimauxAchetes([animal('7', '2024-03-05'), animal('7', '2024-03-05')])).toEqual({
      ok: false,
      erreur: 'boucleRepetee',
    });
    expect(controleDesAnimauxAchetes([animal('', '2024-03-05'), animal('', '2024-03-05')]).ok).toBe(true);
  });

  it('les identifiants des fiches créées par la dépense', () => {
    expect(idsDesAnimauxAchetes({ animauxAchetes: 'a;b;c' })).toEqual(['a', 'b', 'c']);
    expect(idsDesAnimauxAchetes({})).toEqual([]);
  });
});
