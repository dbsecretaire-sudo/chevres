import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seConnecter, seDeconnecter } from '@/features/sync/synchronisation';
import { envoyerAttente, premiereSynchronisation, recevoirChangements, synchroniser } from '@/features/sync/moteur';
import { CLE_ATTENTE, CLE_CURSEUR, ecrireDonnee, lireAttente } from '@/shared/storage/depot';

const fetchSimule = vi.fn();

/** Une réponse du serveur, comme `fetch` la rend. */
function reponse(statut: number, corps: unknown) {
  return { status: statut, json: async () => corps } as Response;
}

/** Ouvre une connexion simulée : le premier appel de `fetch` est la connexion. */
async function seConnecterSimule() {
  fetchSimule.mockResolvedValueOnce(reponse(200, { jeton: 'jeton-test', identifiant: 'moi' }));
  await seConnecter('moi', 'mot-de-passe');
}

describe('le moteur de synchronisation', () => {
  beforeEach(async () => {
    fetchSimule.mockReset();
    vi.stubGlobal('fetch', fetchSimule);
    await AsyncStorage.clear();
    await seDeconnecter();
  });

  it('l’envoi vide la file quand le serveur accepte', async () => {
    await seConnecterSimule();
    await ecrireDonnee('troupeau:v1:animaux', [{ id: 'a', n: 1 }]);
    fetchSimule.mockResolvedValueOnce(reponse(200, { recu: 1 }));

    expect(await envoyerAttente()).toBe(1);
    expect(await lireAttente()).toEqual([]);
    const [url, init] = fetchSimule.mock.calls[1];
    expect(url).toContain('r=pousser');
    expect(JSON.parse(init.body).etablissement).toBe('exploitation');
  });

  it('un envoi refusé garde la file pour la prochaine fois', async () => {
    await seConnecterSimule();
    await ecrireDonnee('troupeau:v1:animaux', [{ id: 'a' }]);
    fetchSimule.mockResolvedValueOnce(reponse(500, { erreur: 'Serveur indisponible.' }));

    await expect(envoyerAttente()).rejects.toThrow('Serveur indisponible.');
    expect(await lireAttente()).toHaveLength(1);
  });

  it('la réception applique les changements du serveur et avance le curseur', async () => {
    await seConnecterSimule();
    fetchSimule.mockResolvedValueOnce(
      reponse(200, {
        modifications: [{ rang: 4, zone: 'troupeau:v1:animaux', identifiant: 'b', contenu: { id: 'b', n: 2 }, version: 1 }],
        curseur: 4,
        encore: false,
      }),
    );

    expect(await recevoirChangements()).toBe(1);
    expect(JSON.parse((await AsyncStorage.getItem('troupeau:v1:animaux')) as string)).toEqual([{ id: 'b', n: 2 }]);
    expect(await AsyncStorage.getItem(CLE_CURSEUR)).toBe('4');
    expect(await lireAttente()).toEqual([]);
  });

  it('une fiche en attente sur cet appareil n’est pas écrasée par la réception', async () => {
    await seConnecterSimule();
    await ecrireDonnee('troupeau:v1:animaux', [{ id: 'a', n: 'mon changement' }]);
    fetchSimule.mockResolvedValueOnce(
      reponse(200, {
        modifications: [{ rang: 2, zone: 'troupeau:v1:animaux', identifiant: 'a', contenu: { id: 'a', n: 'celui du serveur' } }],
        curseur: 2,
        encore: false,
      }),
    );

    await recevoirChangements();
    expect(JSON.parse((await AsyncStorage.getItem('troupeau:v1:animaux')) as string)).toEqual([{ id: 'a', n: 'mon changement' }]);
  });

  it('la réception continue tant que le serveur signale qu’il reste des changements', async () => {
    await seConnecterSimule();
    fetchSimule
      .mockResolvedValueOnce(reponse(200, { modifications: [{ rang: 1, zone: 'z', identifiant: 'a', contenu: { id: 'a' } }], curseur: 1, encore: true }))
      .mockResolvedValueOnce(reponse(200, { modifications: [{ rang: 2, zone: 'z', identifiant: 'b', contenu: { id: 'b' } }], curseur: 2, encore: false }));

    expect(await recevoirChangements()).toBe(2);
    expect(fetchSimule.mock.calls[2][0]).toContain('depuis=1');
  });

  it('une clé propre à l’appareil n’entre jamais dans la file', async () => {
    await seConnecterSimule();
    await AsyncStorage.setItem('troupeau:v1:visite-guidee', JSON.stringify({ actif: true }));
    await AsyncStorage.setItem('troupeau:v1:a-envoyer', '3');
    await premiereSynchronisation().catch(() => undefined);
    expect((await lireAttente()).some((m) => m.zone.includes('visite-guidee') || m.zone.includes('a-envoyer'))).toBe(false);
  });

  it('la première synchronisation envoie les données de l’appareil, après avoir reçu celles du serveur', async () => {
    await seConnecterSimule();
    await AsyncStorage.setItem('troupeau:v1:animaux', JSON.stringify([{ id: 'local', n: 1 }]));
    fetchSimule
      .mockResolvedValueOnce(reponse(200, { modifications: [], curseur: 0, encore: false }))
      .mockResolvedValueOnce(reponse(200, { recu: 1 }));

    await premiereSynchronisation();

    const envoi = fetchSimule.mock.calls[2][1];
    expect(fetchSimule.mock.calls[1][0]).toContain('r=tirer');
    expect(JSON.parse(envoi.body).modifications).toEqual([{ zone: 'troupeau:v1:animaux', identifiant: 'local', contenu: { id: 'local', n: 1 } }]);
    expect(await AsyncStorage.getItem(CLE_CURSEUR)).toBe('0');
  });

  it('une synchronisation déjà faite ne fait que envoyer puis recevoir', async () => {
    await seConnecterSimule();
    await ecrireDonnee('troupeau:v1:animaux', [{ id: 'a' }]);
    await AsyncStorage.setItem(CLE_CURSEUR, '5');
    fetchSimule
      .mockResolvedValueOnce(reponse(200, { recu: 1 }))
      .mockResolvedValueOnce(reponse(200, { modifications: [], curseur: 5, encore: false }));

    await synchroniser();
    expect(fetchSimule.mock.calls[1][0]).toContain('r=pousser');
    expect(fetchSimule.mock.calls[2][0]).toContain('r=tirer');
    expect(await AsyncStorage.getItem(CLE_ATTENTE)).toBe('[]');
  });
});
