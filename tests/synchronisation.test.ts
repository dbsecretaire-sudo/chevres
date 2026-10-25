import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConflitDeSynchronisation,
  envoyerSauvegarde,
  lireConnexion,
  recevoirSauvegarde,
  seConnecter,
  seDeconnecter,
} from '@/features/sync/synchronisation';

const construire = vi.fn();
const restaurer = vi.fn();
vi.mock('@/features/sauvegarde/backup', () => ({
  construireSauvegardeComplete: () => construire(),
  restaurerSauvegarde: (lue: unknown) => restaurer(lue),
}));

const fetchSimule = vi.fn();

/** Une réponse du serveur, comme `fetch` la rend. */
function reponse(statut: number, corps: unknown) {
  return { status: statut, json: async () => corps } as Response;
}

describe('la synchronisation avec le serveur OVH', () => {
  beforeEach(async () => {
    fetchSimule.mockReset();
    construire.mockReset();
    restaurer.mockReset();
    vi.stubGlobal('fetch', fetchSimule);
    await seDeconnecter();
  });

  it('la connexion garde le jeton, pas le mot de passe', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(200, { jeton: 'abc', identifiant: 'moi' }));
    await seConnecter('moi', 'un-mot-de-passe');
    expect(await lireConnexion()).toEqual({ jeton: 'abc', identifiant: 'moi' });
    expect(JSON.stringify(await lireConnexion())).not.toContain('un-mot-de-passe');
  });

  it('une mauvaise connexion ne garde rien', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(401, { erreur: 'Identifiant ou mot de passe incorrect.' }));
    await expect(seConnecter('moi', 'faux')).rejects.toThrow('Identifiant ou mot de passe incorrect.');
    expect(await lireConnexion()).toBeNull();
  });

  it('l’envoi part avec le jeton, la version connue et la sauvegarde complète', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(200, { jeton: 'abc', identifiant: 'moi' }));
    await seConnecter('moi', 'mot');
    construire.mockResolvedValueOnce({ etablissements: [] });
    fetchSimule.mockResolvedValueOnce(reponse(200, { version: 1 }));

    expect(await envoyerSauvegarde()).toBe(1);

    const [url, init] = fetchSimule.mock.calls[1];
    expect(url).toContain('r=ecrire');
    expect(init.headers.Authorization).toBe('Bearer abc');
    const corps = JSON.parse(init.body);
    expect(corps.version_attendue).toBe(0);
    expect(corps.donnees).toEqual({ etablissements: [] });
  });

  it('un envoi plus récent que le serveur est signalé comme conflit', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(200, { jeton: 'abc', identifiant: 'moi' }));
    await seConnecter('moi', 'mot');
    construire.mockResolvedValueOnce({});
    fetchSimule.mockResolvedValueOnce(reponse(409, { erreur: 'Conflit', version: 4 }));

    await expect(envoyerSauvegarde()).rejects.toBeInstanceOf(ConflitDeSynchronisation);
  });

  it('la réception restaure la sauvegarde du serveur', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(200, { jeton: 'abc', identifiant: 'moi' }));
    await seConnecter('moi', 'mot');
    const donnees = { etablissements: [] };
    fetchSimule.mockResolvedValueOnce(reponse(200, { version: 3, donnees }));
    restaurer.mockResolvedValueOnce({ annule: false, misAJour: 2 });

    const resultat = await recevoirSauvegarde();

    expect(restaurer).toHaveBeenCalledWith(donnees);
    expect(resultat.misAJour).toBe(2);
  });

  it('sans sauvegarde sur le serveur, la réception le dit au lieu de restaurer du vide', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(200, { jeton: 'abc', identifiant: 'moi' }));
    await seConnecter('moi', 'mot');
    fetchSimule.mockResolvedValueOnce(reponse(200, { version: 0, donnees: null }));

    await expect(recevoirSauvegarde()).rejects.toThrow('Il n’y a pas encore de sauvegarde');
    expect(restaurer).not.toHaveBeenCalled();
  });
});
