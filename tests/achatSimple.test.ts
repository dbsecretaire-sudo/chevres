import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { annulerAchat, enregistrerAchat } from '@/features/berger/services/achat';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { SEXE } from '@/shared/constants/cheptel';

describe('l’achat du mode normal', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sans prix : l’animal entre au troupeau, sans dépense', async () => {
    const ids = await enregistrerAchat({ boucle: '00555', sexe: SEXE.FEMELLE, vendeur: 'Dupont', date: '2026-10-25', activite: 'chevre' as never });
    const animaux = await listChevresVivantes();
    expect(animaux.find((a) => a.numeroBoucle === '00555')).toMatchObject({ dateEntree: '2026-10-25', vendeur: 'Dupont' });
    expect(ids.factureId).toBeUndefined();
    expect(await listToutesFactures()).toEqual([]);
  });

  it('avec un prix : la dépense est notée, et elle crée la fiche de l’animal', async () => {
    const ids = await enregistrerAchat({ boucle: '00556', sexe: SEXE.MALE, vendeur: 'Martin', date: '2026-10-25', prix: 150, activite: 'chevre' as never });
    expect(ids.factureId).toBeDefined();
    expect((await listToutesFactures()).map((f) => f.montant)).toEqual([150]);
    expect((await listChevresVivantes()).map((a) => a.numeroBoucle)).toContain('00556');
  });

  it('l’annulation retire la fiche et la dépense', async () => {
    const ids = await enregistrerAchat({ boucle: '00557', sexe: SEXE.FEMELLE, vendeur: 'Léa', date: '2026-10-25', prix: 90, activite: 'chevre' as never });
    await annulerAchat(ids);
    expect(await listToutesFactures()).toEqual([]);
    expect((await listChevresVivantes()).map((a) => a.numeroBoucle)).not.toContain('00557');
  });
});
