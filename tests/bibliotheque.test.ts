import { describe, expect, it } from 'vitest';
import { normaliserBibliotheque } from '@/features/bibliotheque/repository';

describe('bibliothèque des documents générés', () => {
  it('ne garde que des documents complets', () => {
    const complet = {
      id: 'd1',
      titre: 'Suivi des mouvements',
      nomFichier: 'suivi.pdf',
      genereLe: '2026-10-17T14:32:00.000Z',
      piece: { id: 'p1', nom: 'suivi.pdf', extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-17' },
    };
    expect(normaliserBibliotheque([complet, { id: 'd2' }, null, 'x'])).toEqual([complet]);
    expect(normaliserBibliotheque(undefined)).toEqual([]);
  });
});
