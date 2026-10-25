import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { CLE_ATTENTE, ecrireDonnee, lireAttente } from '@/shared/storage/depot';

describe('l’écriture d’une donnée synchronisée', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('écrit la valeur sur l’appareil et met ses fiches dans la file d’attente', async () => {
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a', n: 1 }]);
    expect(JSON.parse((await AsyncStorage.getItem('troupeau:v1:z')) as string)).toEqual([{ id: 'a', n: 1 }]);
    expect(await lireAttente()).toEqual([{ zone: 'troupeau:v1:z', identifiant: 'a', contenu: { id: 'a', n: 1 } }]);
  });

  it('une valeur inchangée n’ajoute rien à la file', async () => {
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a', n: 1 }]);
    await AsyncStorage.removeItem(CLE_ATTENTE);
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a', n: 1 }]);
    expect(await lireAttente()).toEqual([]);
  });

  it('une fiche modifiée deux fois n’occupe qu’une place dans la file', async () => {
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a', n: 1 }]);
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a', n: 2 }]);
    expect(await lireAttente()).toEqual([{ zone: 'troupeau:v1:z', identifiant: 'a', contenu: { id: 'a', n: 2 } }]);
  });

  it('des écritures simultanées sur deux zones gardent toutes leurs modifications', async () => {
    await Promise.all([
      ecrireDonnee('troupeau:v1:z1', [{ id: 'a' }]),
      ecrireDonnee('troupeau:v1:z2', [{ id: 'b' }]),
      ecrireDonnee('troupeau:v1:z3', { reglage: true }),
    ]);
    expect(await lireAttente()).toHaveLength(3);
  });

  it('effacer une donnée envoie la suppression de ses fiches', async () => {
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a' }]);
    await AsyncStorage.removeItem(CLE_ATTENTE);
    await ecrireDonnee('troupeau:v1:z', undefined);
    expect(await AsyncStorage.getItem('troupeau:v1:z')).toBeNull();
    expect(await lireAttente()).toEqual([{ zone: 'troupeau:v1:z', identifiant: 'a', contenu: null }]);
  });
});
