import { describe, expect, it } from 'vitest';
import { positionDeLaListe } from '@/shared/utils/listeDeroulante';

const fenetre = { largeur: 1200, hauteur: 900 };

describe('position d’une liste déroulante attachée à son champ', () => {
  it('juste sous le champ, au moins 260 de large, alignée à gauche', () => {
    const p = positionDeLaListe({ champ: { left: 300, top: 100, bottom: 140, width: 180 }, fenetre });
    expect(p).toMatchObject({ left: 300, largeur: 260, top: 142 });
    expect(p.bottom).toBeUndefined();
  });

  it('prend la largeur du champ quand il est plus large', () => {
    expect(positionDeLaListe({ champ: { left: 300, top: 100, bottom: 140, width: 500 }, fenetre }).largeur).toBe(500);
  });

  it('ne sort pas de la fenêtre à droite', () => {
    const p = positionDeLaListe({ champ: { left: 1100, top: 100, bottom: 140, width: 80 }, fenetre });
    expect(p.left).toBe(1200 - 260 - 8);
  });

  it('s’ouvre au-dessus du champ quand il n’y a pas la place dessous', () => {
    const p = positionDeLaListe({ champ: { left: 300, top: 780, bottom: 820, width: 300 }, fenetre });
    expect(p.top).toBeUndefined();
    expect(p.bottom).toBe(900 - 780 + 2);
  });

  it('la hauteur est bornée', () => {
    expect(positionDeLaListe({ champ: { left: 0, top: 10, bottom: 40, width: 300 }, fenetre }).maxHeight).toBe(420);
  });

  it('un zoom de la page ramène les mesures de l’écran à celles de la page', () => {
    const sans = positionDeLaListe({ champ: { left: 300, top: 100, bottom: 140, width: 300 }, fenetre });
    const avec = positionDeLaListe({ champ: { left: 345, top: 115, bottom: 161, width: 345 }, fenetre: { largeur: 1380, hauteur: 1035 }, zoom: 1.15 });
    expect(avec.left).toBeCloseTo(sans.left, 5);
    expect(avec.top).toBeCloseTo(sans.top as number, 5);
  });
});
