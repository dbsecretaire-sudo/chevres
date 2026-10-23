import { describe, expect, it } from 'vitest';
import { COMPTES_PCG_COMPLET, PCG_COMPLET } from '@/shared/constants/pcgComplet';
import { COMPTES_PCG_DEPENSE, COMPTES_PCG_RECETTE } from '@/shared/constants/planComptable';

/** Les mêmes lignes que l'écran du plan comptable général, sans passer par React Native. */
const simple = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const chercher = (recherche: string) => {
  const mots = simple(recherche).split(/\s+/).filter(Boolean);
  return COMPTES_PCG_COMPLET.filter((c) => {
    const texte = simple(`${c.libelle} ${c.note ?? ''}`);
    return mots.every((m) => (/^\d+$/.test(m) ? c.numero.startsWith(m) : texte.includes(m)));
  });
};

describe('plan comptable général en consultation', () => {
  it('a les sept classes, et chaque numéro commence par celle de sa classe, sans doublon', () => {
    expect(PCG_COMPLET.map((c) => c.classe)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    for (const c of COMPTES_PCG_COMPLET) expect(c.numero.startsWith(c.classe), c.numero).toBe(true);
    const numeros = COMPTES_PCG_COMPLET.map((c) => c.numero);
    expect(new Set(numeros).size).toBe(numeros.length);
  });

  it('contient les racines des comptes utilisés par l’application (les 3 premiers chiffres de chacun)', () => {
    const racines = new Set(COMPTES_PCG_COMPLET.map((c) => c.numero));
    const manquantes = [...COMPTES_PCG_DEPENSE, ...COMPTES_PCG_RECETTE]
      .map((c) => c.numero.slice(0, 3))
      .filter((r, i, tous) => tous.indexOf(r) === i && !racines.has(r));
    expect(manquantes).toEqual([]);
  });

  it('se cherche par numéro ou par mot, sans tenir compte des accents', () => {
    expect(chercher('616').map((c) => c.numero)).toEqual(expect.arrayContaining(['616', '6161']));
    expect(chercher('assurance').map((c) => c.numero)).toContain('616');
    expect(chercher('electricite').map((c) => c.numero)).toContain('6061');
    expect(chercher('carburant').map((c) => c.numero)).toContain('60622');
    expect(chercher('zzzz')).toEqual([]);
  });
});
