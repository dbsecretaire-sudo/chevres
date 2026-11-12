import { describe, expect, it } from 'vitest';
import { filtrerNaissances, filtrerNaissancesParStatut } from '@/features/cheptel/services/rechercheNaissances';
import type { PorteeNaissance } from '@/features/cheptel/repository/naissances';
import type { Chevre } from '@/features/cheptel/types';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';

const petit = (id: string, numeroBoucle: string | undefined, sexe: string, dateNaissance: string): Chevre =>
  ({ id, numeroBoucle, sexe, dateNaissance, statut: 'vivante' }) as unknown as Chevre;

const portees: PorteeNaissance[] = [
  {
    date: '2026-03-02',
    mereNumeroBoucle: '00488',
    cabrits: [petit('a', '00836', SEXE.FEMELLE, '2026-03-02'), petit('b', undefined, SEXE.MALE, '2026-03-02')],
  },
  {
    date: '2026-01-22',
    mereNumeroBoucle: '30030',
    cabrits: [petit('c', '00900', SEXE.MALE, '2026-01-22')],
  },
];

const clients = new Map([['a', 'Sébastien Agostini']]);

const ids = (liste: PorteeNaissance[]) => liste.map((p) => p.cabrits.map((c) => c.id));

describe('recherche des naissances', () => {
  it('une recherche vide ne filtre pas, petits compris', () => {
    expect(filtrerNaissances(portees, '  ', clients)).toEqual(portees);
  });

  it('l’acheteur se cherche sans tenir compte des accents ni des majuscules', () => {
    expect(ids(filtrerNaissances(portees, 'agostini', clients))).toEqual([['a']]);
    expect(ids(filtrerNaissances(portees, 'SÉBASTIEN', clients))).toEqual([['a']]);
  });

  it('le n° de la mère garde toute sa mise bas', () => {
    expect(ids(filtrerNaissances(portees, '00488', clients))).toEqual([['a', 'b']]);
  });

  it('le n° du petit ne garde que ce petit et sa mise bas', () => {
    expect(ids(filtrerNaissances(portees, '00900', clients))).toEqual([['c']]);
    expect(ids(filtrerNaissances(portees, '00836', clients))).toEqual([['a']]);
  });

  it('M ou F tout seul ne cherche que le sexe', () => {
    expect(ids(filtrerNaissances(portees, 'f', clients))).toEqual([['a']]);
    expect(ids(filtrerNaissances(portees, 'M', clients))).toEqual([['b'], ['c']]);
  });

  it('la date se tape comme affichée ou en ISO, en partie', () => {
    expect(filtrerNaissances(portees, '02/03/2026', clients).map((p) => p.mereNumeroBoucle)).toEqual(['00488']);
    expect(filtrerNaissances(portees, '2026-01', clients).map((p) => p.mereNumeroBoucle)).toEqual(['30030']);
  });

  it('un mot qui ne correspond à rien ne garde rien', () => {
    expect(filtrerNaissances(portees, 'Dupont', clients)).toEqual([]);
  });
});

describe('filtre vivants ou vendus des naissances', () => {
  const melangees: PorteeNaissance[] = [
    {
      date: '2026-03-02',
      mereNumeroBoucle: '00488',
      cabrits: [
        petit('a', '00836', SEXE.FEMELLE, '2026-03-02'),
        { ...petit('d', '00901', SEXE.MALE, '2026-03-02'), statut: STATUT_CHEVRE.VENDUE },
      ],
    },
  ];

  it('tous ne filtre pas', () => {
    expect(filtrerNaissancesParStatut(melangees, 'tous')).toEqual(melangees);
  });

  it('vivants et vendus ne gardent que les petits de ce statut', () => {
    expect(ids(filtrerNaissancesParStatut(melangees, STATUT_CHEVRE.VIVANTE))).toEqual([['a']]);
    expect(ids(filtrerNaissancesParStatut(melangees, STATUT_CHEVRE.VENDUE))).toEqual([['d']]);
  });

  it('une mise bas sans petit de ce statut disparaît', () => {
    expect(filtrerNaissancesParStatut(portees, STATUT_CHEVRE.VENDUE)).toEqual([]);
  });
});
