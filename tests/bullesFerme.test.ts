import { describe, expect, it } from 'vitest';
import { decalageVertical, ecartDesBulles, positionsEnArc, rayonDesBulles } from '@/features/accueil/services/bullesFerme';

describe('bulles en arc', () => {
  it('une seule bulle part droit dans la direction', () => {
    expect(positionsEnArc(1, 100, 0, 120)).toEqual([{ x: 100, y: 0 }]);
    expect(positionsEnArc(1, 100, 180, 120)).toEqual([{ x: -100, y: 0 }]);
    expect(positionsEnArc(0, 100, 0, 120)).toEqual([]);
  });

  it('vers la droite, les bulles vont du haut vers le bas, de part et d’autre de l’axe', () => {
    const p = positionsEnArc(3, 100, 0, 120);
    expect(p).toHaveLength(3);
    expect(p[0].y).toBeLessThan(p[1].y);
    expect(p[1].y).toBeLessThan(p[2].y);
    expect(p[1]).toEqual({ x: 100, y: 0 });
    expect(p[0].y).toBe(-p[2].y);
    expect(p.every((q) => q.x > 0)).toBe(true);
  });

  it('vers la gauche, les bulles sont à gauche du bouton', () => {
    expect(positionsEnArc(4, 120, 180, 120).every((q) => q.x < 0)).toBe(true);
  });

  it('élargit l’arc avec le nombre de bulles', () => {
    expect(rayonDesBulles(3)).toBe(120);
    expect(rayonDesBulles(6)).toBeGreaterThan(rayonDesBulles(3));
    expect(ecartDesBulles(2)).toBeLessThan(ecartDesBulles(5));
    expect(ecartDesBulles(10)).toBe(140);
  });

  it('décale le bouton pour garder les bulles dans l’écran', () => {
    const p = positionsEnArc(5, 140, 0, 140);
    expect(decalageVertical(p, 500, 900, 60)).toBe(0);
    expect(decalageVertical(p, 80, 900, 60)).toBeGreaterThan(0);
    expect(decalageVertical(p, 880, 900, 60)).toBeLessThan(0);
    expect(decalageVertical([], 10, 900, 60)).toBe(0);
  });
});
