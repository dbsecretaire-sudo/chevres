import { describe, expect, it } from 'vitest';
import { normaliserArchiveStock } from '@/features/stock/repository';

const PIECE = { id: 'p1', nom: 'chevre.jpg', extension: 'jpg', mime: 'image/jpeg', ajoutLe: '2026-10-22' };

describe('images choisies pour les cartes du stock', () => {
  it('garde les images bien formées après la lecture de l’archive', () => {
    const archive = normaliserArchiveStock({ images: { 'fromage:frais': PIECE } });
    expect(archive.images).toEqual({ 'fromage:frais': PIECE });
  });

  it('écarte une image mal formée et ne plante pas quand il n’y en a pas', () => {
    const archive = normaliserArchiveStock({
      images: { 'fromage:frais': { id: 3 }, 'aliment:foin': null } as never,
    });
    expect(archive.images).toEqual({});
    expect(normaliserArchiveStock(undefined).images).toEqual({});
  });
});
