import { describe, expect, it } from 'vitest';
import { ligneDeLaPortee } from '@/features/export/carnetMiseBasPdf';
import { peutRejoindreLeLot } from '@/features/exploitation/services/lotsAnnuels';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import { numerosTiptag } from '@/features/stock/services/boucles';
import type { Chevre } from '@/features/cheptel/types';

const cabri = (boucle: string, extra: Partial<Chevre> = {}): Chevre =>
  ({ id: boucle, sexe: 'M', statut: 'vivante', dateNaissance: '2026-03-05', numeroBoucle: boucle, ...extra }) as unknown as Chevre;
const tiptags = new Set(['60001']);

describe('règle d’or : tout tiptag de cabri est destiné à l’abattoir', () => {
  it('les tiptag se lisent dans l’inventaire des boucles', () => {
    const boucles = [
      { article: 'boucle:tiptag', numero: ' 60001 ' },
      { article: 'boucle:boucles', numero: '10001' },
    ] as never;
    expect([...numerosTiptag(boucles)]).toEqual(['60001']);
    expect(estTiptag(cabri('60001'), tiptags)).toBe(true);
    expect(estTiptag(cabri('10001'), tiptags)).toBe(false);
    expect(estTiptag({ numeroBoucle: undefined }, tiptags)).toBe(false);
  });

  it('le carnet note « A » un cabri à tiptag dès sa naissance, et pas « R » ; une boucle normale n’est pas touchée', () => {
    const portee = (c: Chevre) => ({ date: '2026-03-05', mereNumeroBoucle: '30001', cabrits: [c] });
    expect(ligneDeLaPortee(portee(cabri('60001')), tiptags).observations).toBe('A');
    expect(ligneDeLaPortee(portee(cabri('60001', { renouvellement: true })), tiptags).observations).toBe('A');
    expect(ligneDeLaPortee(portee(cabri('10001', { renouvellement: true })), tiptags).observations).toBe('R');
    expect(ligneDeLaPortee(portee(cabri('60001'))).observations).toBe('');
  });

  it('un tiptag ne rejoint pas le renouvellement', () => {
    const jour = '2026-10-17';
    const adulte = (b: string) => cabri(b, { dateNaissance: '2024-03-01' });
    expect(peutRejoindreLeLot('renouvellement', adulte('60001'), jour, tiptags)).toBe(false);
    expect(peutRejoindreLeLot('renouvellement', adulte('10001'), jour, tiptags)).toBe(true);
  });
});
