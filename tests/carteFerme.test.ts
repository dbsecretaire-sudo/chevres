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
  rectDeLaStele,
  montagnes,
  FERME,
  ENTREE,
  positionsEnEventail,
  bornesEnPerspective,
  carteEstLegere,
  echelleVueDEnsemble,
  rectDuLieu,
} from '@/features/accueil/services/carteFerme';

const dedans = (r: { x: number; y: number; largeur: number; hauteur: number }) =>
  r.x >= 0 && r.y >= 0 && r.x + r.largeur <= CARTE.largeur && r.y + r.hauteur <= CARTE.hauteur;
const secoupent = (a: ReturnType<typeof rectDuLieu>, b: ReturnType<typeof rectDuLieu>) =>
  a.x < b.x + b.largeur && a.x + a.largeur > b.x && a.y < b.y + b.hauteur && a.y + a.hauteur > b.y;

describe('carte de la ferme', () => {
  it('la carte ne laisse pas voir au-delà de ses bords, et se centre quand la vue est plus grande', () => {
    expect(bornes(400, CARTE.largeur)).toEqual({ min: 400 - CARTE.largeur, max: 0 });
    expect(bornes(2400, CARTE.largeur)).toEqual({ min: (2400 - CARTE.largeur) / 2, max: (2400 - CARTE.largeur) / 2 });
    expect(borner(50, bornes(400, CARTE.largeur))).toBe(0);
    expect(borner(-5000, bornes(400, CARTE.largeur))).toBe(400 - CARTE.largeur);
  });

  it('centre la vue sur un point, sans sortir de la carte', () => {
    expect(centrerSur(CENTRE.x, 400, CARTE.largeur)).toBe(200 - CENTRE.x);
    expect(centrerSur(0, 400, CARTE.largeur)).toBe(0);
    expect(centrerSur(CARTE.largeur, 400, CARTE.largeur)).toBe(400 - CARTE.largeur);
  });

  it('les lieux et les routes sont sur la carte, sans se chevaucher ni couvrir l’enclos', () => {
    const rects = LIEUX.map(rectDuLieu);
    rects.forEach((r) => expect(dedans(r)).toBe(true));
    expect(dedans(rectDeLaStele())).toBe(true);
    expect(secoupent(rectDeLaStele(), rectDeLEnclos())).toBe(false);
    ROUTES_GRISES.forEach((r) => expect(secoupent(rectDeLaStele(), r)).toBe(false));
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
    const interdits = [...ROUTES_GRISES, ...rectsDesLieux(), rectDeLaStele()];
    for (const a of arbres) {
      const boite = { x: a.x, y: a.y, largeur: a.taille, hauteur: a.taille };
      expect(interdits.some((r) => secoupent(boite, r))).toBe(false);
    }
  });
});

describe('montagnes', () => {
  it('forment une chaîne le long du bord nord, au-dessus des lieux', () => {
    const chaine = montagnes();
    expect(chaine.length).toBeGreaterThan(10);
    const bas = Math.max(...chaine.map((m) => m.y + m.taille));
    expect(bas).toBeLessThan(Math.min(...LIEUX.map((l) => rectDuLieu(l).y)));
  });
});

function rectsDesLieux() {
  return [...LIEUX.map(rectDuLieu), rectDeLEnclos()];
}

describe('bulles en éventail', () => {
  it('une seule bulle se met au-dessus, plusieurs s’étalent de la gauche vers la droite', () => {
    expect(positionsEnEventail(0, 100)).toEqual([]);
    expect(positionsEnEventail(1, 100)).toEqual([{ x: 0, y: -100 }]);
    const quatre = positionsEnEventail(4, 100);
    expect(quatre).toHaveLength(4);
    expect(quatre[0].x).toBeLessThan(quatre[3].x);
    expect(quatre.every((p) => p.y < 0)).toBe(true);
    expect(quatre[0].x).toBe(-quatre[3].x);
  });
});

describe('perspective et vue d’ensemble', () => {
  it('laisse monter la carte pour que son bord nord atteigne le haut de l’écran', () => {
    expect(bornesEnPerspective(500, CARTE.hauteur)).toEqual({ min: 500 - CARTE.hauteur, max: -125 });
  });
  it('centre la carte quand elle est plus petite que la vue', () => {
    expect(bornesEnPerspective(3000, 1000)).toEqual({ min: 1000, max: 1000 });
  });
  it('la vue d’ensemble fait tenir toute la carte dans la vue', () => {
    const s = echelleVueDEnsemble(400, 600);
    expect(s).toBeGreaterThan(0.05);
    expect(s).toBeLessThan(1);
    expect(CARTE.largeur * s).toBeLessThanOrEqual(400);
    expect(CARTE.hauteur * s).toBeLessThanOrEqual(600 / 0.88);
    expect(echelleVueDEnsemble(5000, 5000)).toBe(1);
  });
});

describe('la ferme clôturée', () => {
  it('tout le village est dans la ferme, la ferme dans la carte, et son entrée au milieu du côté sud', () => {
    const ferme = { x: FERME.x, y: FERME.y, largeur: FERME.largeur, hauteur: FERME.hauteur };
    expect(dedans(ferme)).toBe(true);
    const contenus = [...LIEUX.map(rectDuLieu), rectDeLEnclos(), rectDeLaStele(), ...ROUTES_GRISES];
    for (const r of contenus) {
      expect(r.x).toBeGreaterThanOrEqual(ferme.x);
      expect(r.y).toBeGreaterThanOrEqual(ferme.y);
      expect(r.x + r.largeur).toBeLessThanOrEqual(ferme.x + ferme.largeur);
      expect(r.y + r.hauteur).toBeLessThanOrEqual(ferme.y + ferme.hauteur);
    }
    expect(ENTREE.x).toBe(CENTRE.x);
    expect(ENTREE.y).toBe(ferme.y + ferme.hauteur);
  });
  it('le décor est tout autour de la ferme, jamais dedans', () => {
    for (const a of decor()) {
      const dansLaFerme = a.x + a.taille > FERME.x && a.x < FERME.x + FERME.largeur && a.y + a.taille > FERME.y && a.y < FERME.y + FERME.hauteur;
      expect(dansLaFerme).toBe(false);
    }
  });
});

describe('carte légère', () => {
  it('le choix de l’utilisateur l’emporte ; à défaut, légère sur téléphone seulement', () => {
    expect(carteEstLegere(undefined, true)).toBe(true);
    expect(carteEstLegere(undefined, false)).toBe(false);
    expect(carteEstLegere(false, true)).toBe(false);
    expect(carteEstLegere(true, false)).toBe(true);
  });
});
