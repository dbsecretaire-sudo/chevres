import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { annulerAchat, enregistrerAchat } from '@/features/berger/services/achat';
import { ecrituresACirculation, documentsManquantsToutesAnnees } from '@/features/comptabilite/services/documentsCirculation';
import { getSettings } from '@/features/settings/settings';
import { SEXE } from '@/shared/constants/cheptel';

const rappel = (entrees: Parameters<typeof ecrituresACirculation>[6]) =>
  documentsManquantsToutesAnnees(ecrituresACirculation([], [], new Set(), [], [], [], entrees));

describe('l’achat sans prix et le document de circulation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sans prix, un animal avec boucle devient une entrée qui demande son document', async () => {
    const ids = await enregistrerAchat({ boucle: '00601', sexe: SEXE.FEMELLE, vendeur: 'Dupont', date: '2026-10-25', activite: 'chevre' as never });
    expect(ids.entreeId).toBeDefined();
    expect((await getSettings()).exploitation?.entreesAnimaux).toEqual([
      expect.objectContaining({ id: ids.entreeId, boucle: '00601', date: '2026-10-25' }),
    ]);
    const manquants = rappel((await getSettings()).exploitation?.entreesAnimaux);
    expect(manquants.map((e) => e.type)).toEqual(['entree']);
  });

  it('sans boucle, aucun document n’est demandé', async () => {
    const ids = await enregistrerAchat({ boucle: '', sexe: SEXE.MALE, vendeur: 'Dupont', date: '2026-10-25', activite: 'chevre' as never });
    expect(ids.entreeId).toBeUndefined();
    expect(rappel(undefined)).toEqual([]);
  });

  it('avec un prix, c’est la dépense qui porte le suivi : pas d’entrée en plus', async () => {
    const ids = await enregistrerAchat({ boucle: '00602', sexe: SEXE.FEMELLE, vendeur: 'Martin', date: '2026-10-25', prix: 80, activite: 'chevre' as never });
    expect(ids.entreeId).toBeUndefined();
    expect((await getSettings()).exploitation?.entreesAnimaux ?? []).toEqual([]);
  });

  it('une entrée dont le document est déposé ne figure plus dans le rappel', () => {
    const entree = { id: 'e1', date: '2026-10-25', boucle: '00603', documentCirculation: { piece: { id: 'p', nom: 'doc.pdf', extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-25' }, deposeLe: '2026-10-25T10:00:00Z' } };
    expect(rappel([entree])).toEqual([]);
  });

  it('l’annulation retire l’entrée', async () => {
    const ids = await enregistrerAchat({ boucle: '00604', sexe: SEXE.FEMELLE, vendeur: 'Dupont', date: '2026-10-25', activite: 'chevre' as never });
    await annulerAchat(ids);
    expect((await getSettings()).exploitation?.entreesAnimaux ?? []).toEqual([]);
  });
});
