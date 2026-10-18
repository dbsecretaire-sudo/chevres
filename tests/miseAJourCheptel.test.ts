import { describe, expect, it } from 'vitest';
import { animauxSansVente } from '@/features/cheptel/services/miseAJourCheptel';
import { didacticielDeLApplication } from '@/features/didacticiel/services/didacticiel';
import type { Chevre } from '@/features/cheptel/types';
import type { Vente } from '@/features/comptabilite/types';

const animal = (id: string, statut: string, dateStatut?: string): Chevre =>
  ({ id, statut, dateStatut, sexe: 'F', dateNaissance: '2025-01-01' }) as unknown as Chevre;

describe('mise à jour du cheptel', () => {
  it('les animaux vendus ou à l’abattoir sans vente, du plus récemment sorti au plus ancien', () => {
    const ventes = [{ id: 'v', animaux: 'b' }] as unknown as Vente[];
    const liste = animauxSansVente(
      [
        animal('a', 'abattoir', '2026-02-25'),
        animal('b', 'vendue', '2026-03-01'),
        animal('c', 'vendue', '2026-04-01'),
        animal('d', 'vivante'),
        animal('e', 'morte', '2026-01-01'),
      ],
      ventes,
    );
    expect(liste.map((x) => x.id)).toEqual(['c', 'a']);
  });
});

describe('didacticiel', () => {
  const chapitres = didacticielDeLApplication();

  it('chaque onglet a des options, avec un titre et un texte', () => {
    expect(chapitres.length).toBeGreaterThan(5);
    for (const c of chapitres) {
      expect(c.etapes.length).toBeGreaterThan(0);
      for (const e of c.etapes) {
        expect(e.titre.trim()).not.toBe('');
        expect(e.texte.trim()).not.toBe('');
      }
    }
  });

  it('les identifiants sont uniques', () => {
    const ids = [...chapitres.map((c) => c.id), ...chapitres.flatMap((c) => c.etapes.map((e) => e.id))];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
