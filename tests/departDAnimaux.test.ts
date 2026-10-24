import { describe, expect, it } from 'vitest';
import {
  delierLaFactureDuLot,
  lierLaFactureAuLot,
  lotDuBonDeLivraison,
  lotsDAbattoirAFacturer,
  poserLeDocumentDuLot,
} from '@/features/exploitation/services/departDAnimaux';
import { lotsDAbattoirSansFacture } from '@/features/exploitation/services/lotsSansFacture';
import type { LotAnimaux } from '@/features/settings/settings';

const lot = (id: string, extra: Partial<LotAnimaux> = {}): LotAnimaux => ({ id, nom: id, boucles: '', ...extra });
const document = { piece: { id: 'p', nom: 'circulation.pdf' }, deposeLe: '2026-10-20T10:00:00Z' } as never;

describe('lot d’un départ d’animaux', () => {
  it('crée le lot d’abattoir du jour du départ, avec son document', () => {
    const r = lotDuBonDeLivraison([], { date: '2026-10-20', boucles: ['12', '7'], document, nouvelId: () => 'n1' });
    expect(r.lot).toMatchObject({
      id: 'n1',
      boucles: '12, 7',
      abattoir: '2026-10-20',
      categorie: 'abattoir',
      depart: true,
      documentCirculation: document,
    });
    expect(r.lot.nom).toContain('20/10/2026');
    expect(r.lots).toHaveLength(1);
  });

  it('complète le lot du même jour au lieu d’en créer un deuxième', () => {
    const existant = lot('a', { abattoir: '2026-10-20', boucles: '12, 7', depart: true, documentCirculation: document });
    const r = lotDuBonDeLivraison([existant, lot('b')], { date: '2026-10-20', boucles: ['7', '30'] });
    expect(r.lots).toHaveLength(2);
    expect(r.lot.id).toBe('a');
    expect(r.lot.boucles).toBe('12, 30, 7');
    // Le document déjà déposé reste quand le départ n’en apporte pas.
    expect(r.lot.documentCirculation).toBe(document);
  });

  it('un bon de livraison est toujours un lot d’abattoir : il ne crée jamais de départ d’animaux vivants', () => {
    const r = lotDuBonDeLivraison([lot('a', { abattoir: '2026-10-19' })], { date: '2026-10-20', boucles: ['5'], nouvelId: () => 'v1' });
    expect(r.lot).toMatchObject({ id: 'v1', categorie: 'abattoir', abattoir: '2026-10-20' });
    expect(r.lots).toHaveLength(2);
  });
});

describe('facture de l’abattoir émise après le départ', () => {
  it('les lots d’abattoir sans facture attendent la leur, du plus récent au plus ancien', () => {
    const lots = [
      lot('a', { abattoir: '2026-09-01' }),
      lot('b', { abattoir: '2026-10-20' }),
      lot('c', { abattoir: '2026-08-01', factureId: 'f1' }),
      lot('d'),
    ];
    expect(lotsDAbattoirAFacturer(lots).map((l) => l.id)).toEqual(['b', 'a']);
  });

  it('lier la facture ne change ni la date du départ ni le document', () => {
    const lots = [lot('a', { abattoir: '2026-10-20', depart: true, documentCirculation: document, fraisAbattoir: 40 })];
    const lies = lierLaFactureAuLot(lots, 'a', 'f9');
    expect(lies[0]).toMatchObject({ abattoir: '2026-10-20', factureId: 'f9', documentCirculation: document });
    expect(lies[0].fraisAbattoir).toBeUndefined();
  });

  it('la facture supprimée est détachée du lot de départ, qui n’est pas retiré', () => {
    const lots = [lot('a', { abattoir: '2026-10-20', depart: true, factureId: 'f9', documentCirculation: document })];
    expect(lotsDAbattoirSansFacture(lots, new Set())).toEqual([]);
    expect(delierLaFactureDuLot(lots, 'f9')[0].factureId).toBeUndefined();
  });

  it('le document se pose et se retire', () => {
    const lots = [lot('a')];
    expect(poserLeDocumentDuLot(lots, 'a', document)[0].documentCirculation).toBe(document);
    expect(poserLeDocumentDuLot(poserLeDocumentDuLot(lots, 'a', document), 'a', undefined)[0].documentCirculation).toBeUndefined();
  });
});

describe('plusieurs abattoirs', () => {
  it('deux départs le même jour vers deux abattoirs font deux lots, chacun avec son abattoir', () => {
    let lots: LotAnimaux[] = [];
    lots = lotDuBonDeLivraison(lots, { date: '2026-10-20', boucles: ['1'], contactCle: 'a1', nouvelId: () => 'x' }).lots;
    const r = lotDuBonDeLivraison(lots, { date: '2026-10-20', boucles: ['2'], contactCle: 'a2', nouvelId: () => 'y' });
    expect(r.lots.map((l) => [l.id, l.contactCle])).toEqual([['x', 'a1'], ['y', 'a2']]);
    // Le même abattoir le même jour complète le lot existant.
    const suite = lotDuBonDeLivraison(r.lots, { date: '2026-10-20', boucles: ['3'], contactCle: 'a1' });
    expect(suite.lots).toHaveLength(2);
    expect(suite.lot.boucles).toBe('1, 3');
  });
});
