import { describe, expect, it } from 'vitest';
import { nombresParTaille, type MotLu } from '@/features/cheptel/ocr/googleVision';

/** Un mot posé sur la photo : son texte, sa hauteur (la taille de l'écriture). */
const mot = (description: string, hauteur: number, y = 0): MotLu => ({
  description,
  boundingPoly: { vertices: [{ x: 0, y }, { x: 50, y }, { x: 50, y: y + hauteur }, { x: 0, y: y + hauteur }] },
});

describe('lecture du numéro d’une boucle sur la photo', () => {
  it('le gros numéro de la boucle passe avant le numéro d’exploitation, même plus court', () => {
    // FR / 2021 3003 (petit) / 30004 (gros)
    const mots = [mot('FR', 20), mot('2021', 22, 30), mot('3003', 22, 30), mot('30004', 70, 60)];
    expect(nombresParTaille(mots)[0]).toBe('30004');
    expect(nombresParTaille(mots)).toEqual(['30004', '2021', '3003']);
  });

  it('ignore les lettres (FR), les mots mélangés de chiffres et de lettres, et un chiffre isolé', () => {
    const mots = [mot('FR', 40), mot('A12', 40), mot('7', 90), mot('12420', 60)];
    expect(nombresParTaille(mots)).toEqual(['12420']);
  });

  it('à taille égale, le plus long d’abord, sans doublon', () => {
    const mots = [mot('123', 50), mot('12345', 50), mot('123', 50)];
    expect(nombresParTaille(mots)).toEqual(['12345', '123']);
  });

  it('une photo sans mot ne donne rien', () => {
    expect(nombresParTaille([])).toEqual([]);
  });
});
