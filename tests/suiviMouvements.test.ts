import { describe, expect, it } from 'vitest';
import { suiviMouvements } from '@/features/cheptel/services/suiviMouvements';
import type { Chevre } from '@/features/cheptel/types';

const animal = (id: string, plus: Partial<Chevre>): Chevre =>
  ({ id, sexe: 'F', statut: 'vivante', dateNaissance: '2026-02-01', ...plus }) as unknown as Chevre;
const libelles = { abattoir: 'Abattoir', autoConsommation: 'Auto-consommation' };

describe('suivi des mouvements du dossier PAC', () => {
  it('les cabris sans boucle (naissance, vente) ne figurent pas dans le document', () => {
    const animaux = [
      animal('a', { numeroBoucle: '10001' }),
      animal('b', { numeroBoucle: '10002', statut: 'vendue', dateStatut: '2026-09-01' }),
      animal('c', { numeroBoucle: undefined, statut: 'vendue', dateStatut: '2026-03-01' }),
      animal('d', { numeroBoucle: '  ' }),
    ];
    const suivi = suiviMouvements(animaux, [], 2026, libelles);
    const naissances = suivi.lignes.filter((l) => l.cause === 'N');
    expect(naissances.reduce((n, l) => n + l.entrees.jeunes, 0)).toBe(2);
    // Aucune vente de la liste ne vient du cabri sans boucle (mars) : seule celle de septembre y est.
    expect(suivi.lignes.filter((l) => l.cause === 'V').map((l) => l.date)).toEqual(['2026-09-01']);
  });

  it('un cabri sans boucle auto-consommé figure dans le document (naissance et sortie)', () => {
    const suivi = suiviMouvements([animal('e', { numeroBoucle: undefined, statut: 'autoconsommee', dateStatut: '2026-03-01' })], [], 2026, libelles);
    expect(suivi.lignes.filter((l) => l.cause === 'N').reduce((n, l) => n + l.entrees.jeunes, 0)).toBe(1);
  });

  it('les animaux avec boucle comptent comme avant', () => {
    const suivi = suiviMouvements([animal('a', { numeroBoucle: '10001', dateNaissance: '2020-01-01' })], [], 2026, libelles);
    expect(suivi.effectifDebut.femelles).toBe(1);
    expect(suivi.effectifFin.femelles).toBe(1);
  });
});

describe('animaux achetés', () => {
  it('un animal acheté entre à la date de l’achat, en « achat » chez son vendeur, et non à sa naissance', () => {
    const suivi = suiviMouvements(
      [animal('x', { numeroBoucle: '30001', dateNaissance: '2024-03-01', dateEntree: '2026-05-10', vendeur: 'Casanova' })],
      [],
      2026,
      libelles,
    );
    expect(suivi.effectifDebut.femelles).toBe(0);
    const achat = suivi.lignes.find((l) => l.cause === 'A');
    expect(achat?.date).toBe('2026-05-10');
    expect(achat?.nom).toBe('Casanova');
    expect(achat?.entrees.femelles).toBe(1);
    expect(suivi.lignes.some((l) => l.cause === 'N')).toBe(false);
    expect(suivi.effectifFin.femelles).toBe(1);
  });

  it('acheté l’année d’avant, il compte dans l’effectif de début', () => {
    const suivi = suiviMouvements([animal('y', { numeroBoucle: '30002', dateNaissance: '2024-03-01', dateEntree: '2025-05-10' })], [], 2026, libelles);
    expect(suivi.effectifDebut.femelles).toBe(1);
    expect(suivi.lignes.some((l) => l.cause === 'A')).toBe(false);
  });
});
