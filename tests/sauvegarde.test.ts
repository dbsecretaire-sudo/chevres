import { beforeEach, describe, expect, it } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  joursEntre,
  lireSuiviSauvegarde,
  noterSauvegarde,
  retardDeSauvegarde,
} from '@/features/sauvegarde/derniereSauvegarde';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('rappel de sauvegarde', () => {
  it('compte les jours entre deux dates', () => {
    expect(joursEntre('2026-01-01', '2026-01-15')).toBe(14);
    expect(joursEntre('2026-02-27', '2026-03-02')).toBe(3);
  });

  it('ne gronde pas tout de suite à la première ouverture', async () => {
    const suivi = await lireSuiviSauvegarde('2026-03-01');
    expect(retardDeSauvegarde(suivi, '2026-03-10')).toBeUndefined();
    expect(retardDeSauvegarde(suivi, '2026-03-20')).toEqual({ jours: 19, jamais: true });
  });

  it('le suivi commencé reste fixe aux ouvertures suivantes', async () => {
    await lireSuiviSauvegarde('2026-03-01');
    expect((await lireSuiviSauvegarde('2026-03-30')).depuis).toBe('2026-03-01');
  });

  it('une sauvegarde récente fait taire le rappel, une ancienne le rappelle', async () => {
    await lireSuiviSauvegarde('2026-01-01');
    await noterSauvegarde('2026-03-01');
    const suivi = await lireSuiviSauvegarde('2026-03-05');
    expect(suivi.derniere).toBe('2026-03-01');
    expect(retardDeSauvegarde(suivi, '2026-03-10')).toBeUndefined();
    expect(retardDeSauvegarde(suivi, '2026-03-20')).toEqual({ jours: 19, jamais: false });
  });
});
