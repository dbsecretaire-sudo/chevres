import type { Chevre } from '@/features/cheptel/types';

/** Répartit un poids total (kg) sur les animaux : proportionnellement à leurs poids connus, sinon à parts égales (arrondi au centième de kilo). */
export function repartirLePoids(animaux: Chevre[], total: number): Chevre[] {
  const connus = animaux.reduce((somme, a) => somme + (a.poidsKg ?? 0), 0);
  const arrondi = (n: number) => Math.round(n * 100) / 100;
  return animaux.map((a) => ({
    ...a,
    poidsKg: arrondi(connus > 0 && a.poidsKg !== undefined ? (a.poidsKg / connus) * total : total / animaux.length),
  }));
}
