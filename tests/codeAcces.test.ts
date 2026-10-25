import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { CLE_CODE, changerCode, codeDefini, definirCode, supprimerCode, verifierCode } from '@/features/securite/codeAcces';
import { estSynchronisable } from '@/shared/storage/depot';

describe('le code d’accès de l’application', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sans code défini, rien n’est demandé ; une fois défini, seul le bon code passe', async () => {
    expect(await codeDefini()).toBe(false);
    await definirCode('ferme-2026');
    expect(await codeDefini()).toBe(true);
    expect(await verifierCode('ferme-2026')).toBe(true);
    expect(await verifierCode('ferme-2025')).toBe(false);
  }, 30000);

  it('l’empreinte n’est pas le code, et chaque définition a son propre sel', async () => {
    await definirCode('ferme-2026');
    const brut = (await AsyncStorage.getItem(CLE_CODE)) as string;
    expect(brut).not.toContain('ferme-2026');
    await definirCode('ferme-2026');
    expect(await AsyncStorage.getItem(CLE_CODE)).not.toBe(brut);
  }, 60000);

  it('changer le code exige l’ancien ; supprimer aussi', async () => {
    await definirCode('ancien-code');
    expect(await changerCode('mauvais-code', 'nouveau-code')).toBe(false);
    expect(await changerCode('ancien-code', 'nouveau-code')).toBe(true);
    expect(await verifierCode('nouveau-code')).toBe(true);
    expect(await supprimerCode('mauvais-code')).toBe(false);
    expect(await supprimerCode('nouveau-code')).toBe(true);
    expect(await codeDefini()).toBe(false);
  }, 60000);

  it('le code n’est jamais synchronisé avec le serveur', () => {
    expect(estSynchronisable(CLE_CODE)).toBe(false);
  });
});
