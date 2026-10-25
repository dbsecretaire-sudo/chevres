import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { ecrireDonnee, retirerDeAttente, surAttente } from '@/shared/storage/depot';

describe('la file d’attente prévient ceux qui la suivent à chaque écriture', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('une saisie puis un envoi donnent le nouveau nombre à chaque fois', async () => {
    const nombres: number[] = [];
    const arret = surAttente((nombre) => nombres.push(nombre));
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a', n: 1 }]);
    await retirerDeAttente([{ zone: 'troupeau:v1:z', identifiant: 'a', contenu: { id: 'a', n: 1 } }]);
    arret();
    expect(nombres).toEqual([1, 0]);
  });

  it('un écouteur qui s’est désabonné ne reçoit plus rien', async () => {
    const nombres: number[] = [];
    const arret = surAttente((nombre) => nombres.push(nombre));
    arret();
    await ecrireDonnee('troupeau:v1:z', [{ id: 'a', n: 1 }]);
    expect(nombres).toEqual([]);
  });
});
