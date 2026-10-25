import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { annulerVenteVivante, enregistrerVenteVivante } from '@/features/berger/services/venteVivante';
import { getSettings } from '@/features/settings/settings';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { TYPE_CHOIX_FACTURE } from '@/shared/constants/comptabilite';
import type { Chevre } from '@/features/cheptel/types';
import type { Client } from '@/features/clients/types';

const animal = { id: 'c1', numeroBoucle: '00467', espece: 'chevre' } as unknown as Chevre;
const acheteur = { id: 'k1', nom: 'Dupont', prenom: 'Marie' } as unknown as Client;

describe('la vente vivante du mode normal', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('enregistre la vente d’animaux (pour le document), la recette sans facture, et lie les deux', async () => {
    const ids = await enregistrerVenteVivante(animal, { activite: 'chevre', date: '2026-10-25', prix: 120, client: acheteur });

    const reglages = await getSettings();
    expect(reglages.exploitation?.ventesVivants).toEqual([
      expect.objectContaining({ id: ids.venteId, boucles: '00467', contactCle: 'k1', date: '2026-10-25' }),
    ]);
    const recette = (await listToutesVentes()).find((v) => v.id === ids.recetteId);
    expect(recette).toMatchObject({ prix: 120, choixFacture: TYPE_CHOIX_FACTURE.SANS_FACTURE, lotId: ids.venteId });
  });

  it('l’annulation retire la recette et la vente d’animaux', async () => {
    const ids = await enregistrerVenteVivante(animal, { activite: 'chevre', date: '2026-10-25', prix: 120, client: acheteur });
    await annulerVenteVivante(animal, ids);

    expect((await getSettings()).exploitation?.ventesVivants ?? []).toEqual([]);
    expect((await listToutesVentes()).find((v) => v.id === ids.recetteId)).toBeUndefined();
  });
});
