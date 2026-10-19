import { describe, expect, it } from 'vitest';
import {
  CARTE,
  CENTRE,
  LIEUX,
  ROUTES_GRISES,
  borner,
  bornes,
  centrerSur,
  decor,
  rectDeLEnclos,
  rectDuLieu,
} from '@/features/accueil/services/carteFerme';

const dedans = (r: { x: number; y: number; largeur: number; hauteur: number }) =>
  r.x >= 0 && r.y >= 0 && r.x + r.largeur <= CARTE.largeur && r.y + r.hauteur <= CARTE.hauteur;
const secoupent = (a: ReturnType<typeof rectDuLieu>, b: ReturnType<typeof rectDuLieu>) =>
  a.x < b.x + b.largeur && a.x + a.largeur > b.x && a.y < b.y + b.hauteur && a.y + a.hauteur > b.y;

describe('carte de la ferme', () => {
  it('la carte ne laisse pas voir au-delà de ses bords, et se centre quand la vue est plus grande', () => {
    expect(bornes(400, 1600)).toEqual({ min: -1200, max: 0 });
    expect(bornes(2000, 1600)).toEqual({ min: 200, max: 200 });
    expect(borner(50, bornes(400, 1600))).toBe(0);
    expect(borner(-5000, bornes(400, 1600))).toBe(-1200);
  });

  it('centre la vue sur un point, sans sortir de la carte', () => {
    expect(centrerSur(CENTRE.x, 400, CARTE.largeur)).toBe(-600);
    expect(centrerSur(0, 400, CARTE.largeur)).toBe(0);
    expect(centrerSur(CARTE.largeur, 400, CARTE.largeur)).toBe(-1200);
  });

  it('les lieux et les routes sont sur la carte, sans se chevaucher ni couvrir l’enclos', () => {
    const rects = LIEUX.map(rectDuLieu);
    rects.forEach((r) => expect(dedans(r)).toBe(true));
    ROUTES_GRISES.forEach((r) => expect(dedans(r)).toBe(true));
    rects.forEach((r, i) => {
      expect(secoupent(r, rectDeLEnclos())).toBe(false);
      rects.slice(i + 1).forEach((autre) => expect(secoupent(r, autre)).toBe(false));
    });
  });

  it('le décor est toujours le même, nombreux, et ne pousse ni sur les routes ni sur les lieux', () => {
    const arbres = decor();
    expect(arbres.length).toBeGreaterThan(30);
    expect(decor()).toEqual(arbres);
    const interdits = [...ROUTES_GRISES, ...rectsDesLieux()];
    for (const a of arbres) {
      const boite = { x: a.x, y: a.y, largeur: a.taille, hauteur: a.taille };
      expect(interdits.some((r) => secoupent(boite, r))).toBe(false);
    }
  });
});

function rectsDesLieux() {
  return [...LIEUX.map(rectDuLieu), rectDeLEnclos()];
}
