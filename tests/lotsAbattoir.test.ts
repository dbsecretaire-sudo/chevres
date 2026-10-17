import { describe, expect, it } from 'vitest';
import { animauxARemettreALAbattoir, lotsDAbattoir, sansLaBoucleDesLotsDAbattoir } from '@/features/exploitation/services/lots';
import type { Chevre } from '@/features/cheptel/types';
import type { LotAnimaux } from '@/features/settings/settings';

const animal = (numeroBoucle: string | undefined, statut: string, dateStatut?: string): Chevre =>
  ({ id: numeroBoucle ?? Math.random().toString(), numeroBoucle, statut, dateStatut, sexe: 'M', dateNaissance: '2025-12-20' }) as unknown as Chevre;

describe('lots d’abattoir', () => {
  it('un lot par jour d’abattage, avec les boucles des animaux abattus ce jour-là', () => {
    const lots = lotsDAbattoir(
      [
        animal('00837', 'abattoir', '2026-02-25'),
        animal('00836', 'abattoir', '2026-02-25'),
        animal('00900', 'abattoir', '2026-03-10'),
        animal(undefined, 'abattoir', '2026-02-25'),
        animal('00001', 'vivante'),
      ],
      [],
      (() => {
        let n = 0;
        return () => `id${++n}`;
      })(),
    );
    expect(lots?.map((l) => [l.nom, l.boucles, l.abattoir])).toEqual([
      ['Abattoir du 25/02/2026', '00836, 00837', '2026-02-25'],
      ['Abattoir du 10/03/2026', '00900', '2026-03-10'],
    ]);
  });

  it('un lot déjà à jour n’est pas refait ; un lot incomplet est complété ; les autres lots ne bougent pas', () => {
    const autre: LotAnimaux = { id: 'x', nom: 'Chevrettes 2026', boucles: '1, 2' };
    const existant: LotAnimaux = { id: 'a', nom: 'Abattoir du 25/02/2026', boucles: '00836', abattoir: '2026-02-25' };
    const bêtes = [animal('00836', 'abattoir', '2026-02-25'), animal('00837', 'abattoir', '2026-02-25')];
    const complete = lotsDAbattoir(bêtes, [autre, existant]);
    expect(complete?.find((l) => l.id === 'a')?.boucles).toBe('00836, 00837');
    expect(complete?.find((l) => l.id === 'x')).toEqual(autre);
    expect(lotsDAbattoir(bêtes, complete ?? [])).toBeNull();
  });
});

describe('lots d’abattoir : un animal remis vivant par erreur', () => {
  it('reste dans son lot (les boucles ne sont jamais retirées), les nouveaux animaux du jour s’y ajoutent', () => {
    const lot: LotAnimaux = { id: 'a', nom: 'Abattoir du 25/02/2026', boucles: '00836, 00837', abattoir: '2026-02-25', categorie: 'abattoir' };
    // 00836 est redevenu vivant ; 00837 est toujours à l'abattoir ; 00838 vient d'être abattu ce jour-là.
    const suite = lotsDAbattoir(
      [animal('00836', 'vivante'), animal('00837', 'abattoir', '2026-02-25'), animal('00838', 'abattoir', '2026-02-25')],
      [lot],
    );
    expect(suite?.[0].boucles).toBe('00836, 00837, 00838');
    // Tout le monde est redevenu vivant : le lot ne bouge pas.
    expect(lotsDAbattoir([animal('00836', 'vivante'), animal('00837', 'vivante')], [lot])).toBeNull();
  });
});

describe('lots d’abattoir : un animal du lot est abattu', () => {
  it('une fiche vivante d’un lot d’abattoir est remise à l’abattoir, au jour du lot', () => {
    const lot: LotAnimaux = { id: 'a', nom: 'Abattoir du 25/02/2026', boucles: '00836, 00837', abattoir: '2026-02-25', categorie: 'abattoir' };
    const remis = animauxARemettreALAbattoir(
      [animal('00836', 'vivante'), animal('00837', 'abattoir', '2026-02-25'), animal('00900', 'vivante'), animal('00838', 'morte', '2026-01-01')],
      [lot],
    );
    expect(remis.map((a) => [a.numeroBoucle, a.statut, a.dateStatut])).toEqual([['00836', 'abattoir', '2026-02-25']]);
  });

  it('un animal dont la date d’abattage est corrigée change de lot ; remis dans le cheptel à la main, il quitte son lot', () => {
    const l25: LotAnimaux = { id: 'a', nom: 'Abattoir du 25/02/2026', boucles: '00836, 00837', abattoir: '2026-02-25', categorie: 'abattoir' };
    const suite = lotsDAbattoir([animal('00836', 'abattoir', '2026-02-26'), animal('00837', 'abattoir', '2026-02-25')], [l25], () => 'n') as LotAnimaux[];
    expect(suite.find((l) => l.abattoir === '2026-02-25')?.boucles).toBe('00837');
    expect(suite.find((l) => l.abattoir === '2026-02-26')?.boucles).toBe('00836');
    expect(sansLaBoucleDesLotsDAbattoir([l25], '00836')[0].boucles).toBe('00837');
  });
});
