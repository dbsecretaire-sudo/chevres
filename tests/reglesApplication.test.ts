import { describe, expect, it } from 'vitest';
import { reglesDeLApplication } from '@/features/settings/services/reglesApplication';

describe('règles de l’application', () => {
  const groupes = reglesDeLApplication();

  it('chaque domaine a des règles, avec un titre et un texte', () => {
    expect(groupes.length).toBeGreaterThan(0);
    for (const g of groupes) {
      expect(g.regles.length).toBeGreaterThan(0);
      for (const r of g.regles) {
        expect(r.titre.trim()).not.toBe('');
        expect(r.texte.trim()).not.toBe('');
      }
    }
  });

  it('les identifiants sont uniques (on s’en servira pour choisir celles à afficher ou à personnaliser)', () => {
    const ids = [...groupes.map((g) => g.id), ...groupes.flatMap((g) => g.regles.map((r) => r.id))];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('les valeurs de l’application sont lues, pas recopiées', () => {
    const texte = groupes.flatMap((g) => g.regles).find((r) => r.id === 'animaux.petit')?.texte ?? '';
    expect(texte).toMatch(/\d+ (jours|semaines|mois)/);
  });
});
