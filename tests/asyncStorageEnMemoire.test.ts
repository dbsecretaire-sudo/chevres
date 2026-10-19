import { describe, expect, it } from 'vitest';
import Natif from '@react-native-async-storage/async-storage';
import AsyncStorage from '@/shared/storage/asyncStorageEnMemoire';

// Dans les tests, « @react-native-async-storage/async-storage » est une mémoire (tests/stubs) : elle joue ici le stockage du téléphone.
describe('stockage du téléphone gardé en mémoire', () => {
  it('lit, écrit et efface aussi dans le téléphone', async () => {
    await AsyncStorage.setItem('a', '1');
    expect(await AsyncStorage.getItem('a')).toBe('1');
    expect(await Natif.getItem('a')).toBe('1');

    await AsyncStorage.multiSet([
      ['b', '2'],
      ['c', '3'],
    ]);
    expect(await AsyncStorage.multiGet(['a', 'b', 'zz'])).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['zz', null],
    ]);
    expect((await AsyncStorage.getAllKeys()).sort()).toEqual(['a', 'b', 'c']);

    await AsyncStorage.removeItem('a');
    expect(await AsyncStorage.getItem('a')).toBeNull();
    expect(await Natif.getItem('a')).toBeNull();

    await AsyncStorage.multiRemove(['b', 'c']);
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    expect(await Natif.getAllKeys()).toEqual([]);
  });

  it('remet la mémoire d’accord quand le téléphone refuse d’écrire', async () => {
    await AsyncStorage.setItem('k', 'avant');
    const setItemNatif = Natif.setItem;
    Natif.setItem = async () => {
      throw new Error('disque plein');
    };
    await expect(AsyncStorage.setItem('k', 'après')).rejects.toThrow('disque plein');
    Natif.setItem = setItemNatif;
    expect(await AsyncStorage.getItem('k')).toBe('avant');
    await AsyncStorage.removeItem('k');
  });
});
