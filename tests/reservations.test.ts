import { describe, expect, it } from 'vitest';
import {
  disponiblesPourLaCommande,
  estReserve,
  liberer,
  reserver,
  reservesDeLaCommande,
} from '@/features/cheptel/services/reservations';
import type { Chevre } from '@/features/cheptel/types';

const animal = (id: string, extra: Partial<Chevre> = {}): Chevre =>
  ({ id, sexe: 'F', statut: 'vivante', dateNaissance: '2026-03-01', ...extra }) as unknown as Chevre;

describe('réservation des animaux', () => {
  it('réserve et libère un animal', () => {
    const reserve = reserver(animal('a'), { client: 'Marie', clientId: 'c1', date: '2026-10-17' });
    expect(estReserve(reserve)).toBe(true);
    expect(reserve.reservation?.client).toBe('Marie');
    const libre = liberer(reserve);
    expect(estReserve(libre)).toBe(false);
    expect('reservation' in libre).toBe(false);
  });

  it('un animal vendu ou mort n’est plus réservé', () => {
    const vendu = animal('a', { statut: 'vendue', reservation: { client: 'Marie', date: '2026-10-17' } });
    expect(estReserve(vendu)).toBe(false);
    expect(estReserve(animal('b', { statut: 'abattoir', reservation: { client: 'Marie', date: '2026-10-17' } }))).toBe(true);
  });

  it('un bon de commande retrouve ses animaux et propose ceux qui sont libres', () => {
    const a = animal('a', { reservation: { client: 'Marie', commandeId: 'cmd1', date: '2026-10-17' } });
    const b = animal('b', { reservation: { client: 'Paul', commandeId: 'cmd2', date: '2026-10-17' } });
    const c = animal('c');
    expect(reservesDeLaCommande([a, b, c], 'cmd1').map((x) => x.id)).toEqual(['a']);
    expect(disponiblesPourLaCommande([a, b, c], 'cmd1').map((x) => x.id)).toEqual(['a', 'c']);
    expect(disponiblesPourLaCommande([a, b, c]).map((x) => x.id)).toEqual(['c']);
  });
});
