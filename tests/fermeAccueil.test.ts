import { describe, expect, it } from 'vitest';
import {
  autonomieAliments,
  construireMinuteurs,
  dureeCourte,
  joursJusqua,
  progressionPapiers,
  prochaineEcheance,
  type EntreeMinuteurs,
} from '@/features/accueil/services/fermeAccueil';
import type { MouvementStock } from '@/features/stock/types';

const base: EntreeMinuteurs = { aujourdhui: '2026-10-19', declarations: [], documentsAEnvoyer: 0, lotsAFacturer: 0, lotsARappeler: 0 };

describe('minuteurs de l’accueil', () => {
  it('les jours jusqu’à une date, et ce que dit la pastille', () => {
    expect(joursJusqua('2026-10-19', '2026-10-31')).toBe(12);
    expect(joursJusqua('2026-10-19', '2026-10-18')).toBe(-1);
    expect(dureeCourte(12)).toBe('12 j');
    expect(dureeCourte(0)).toBe('Auj.');
    expect(dureeCourte(-3)).toBe('Retard');
  });

  it('les plus pressés d’abord : le retard, ce qui est à faire de suite, les échéances proches, puis le reste à faire sans date', () => {
    const m = construireMinuteurs({
      ...base,
      finLait: '2026-10-22',
      declarations: [
        { id: 'a', libelle: 'RSA', echeance: '2026-10-31', enRetard: false, route: '/rsa' },
        { id: 'b', libelle: 'URSSAF', echeance: '2026-10-01', enRetard: true, route: '/urssaf' },
      ],
      bilan: { etat: 'aucun' },
      documentsAEnvoyer: 12,
      lotsAFacturer: 1,
    });
    expect(m.map((x) => x.libelle)).toEqual(['URSSAF', 'Bilan sanitaire', 'Délai lait', 'Documents à envoyer', 'Lots à facturer', 'RSA']);
    expect(m[0]).toMatchObject({ valeur: 'Retard', urgent: true });
    expect(m[2]).toMatchObject({ valeur: '3 j', urgent: false });
    expect(m.find((x) => x.id === 'circulation')?.valeur).toBe('12');
  });

  it('un délai d’attente terminé et un bilan à jour n’ont pas de minuteur', () => {
    expect(construireMinuteurs({ ...base, finLait: '2026-10-01', bilan: { etat: 'valide', echeance: '2027-03-01' } })).toEqual([]);
  });

  it('la prochaine échéance est la première qui a une date', () => {
    const m = construireMinuteurs({
      ...base,
      documentsAEnvoyer: 3,
      declarations: [{ id: 'a', libelle: 'RSA', echeance: '2026-10-31', enRetard: false, route: '/rsa' }],
    });
    expect(prochaineEcheance(m)).toEqual({ texte: 'RSA dans 12 j', route: '/rsa' });
    expect(prochaineEcheance(construireMinuteurs({ ...base, documentsAEnvoyer: 3 }))).toBeUndefined();
  });
});

describe('papiers à jour', () => {
  it('compte ce qui est fait et ce qui reste, pour l’année seulement', () => {
    const r = progressionPapiers({
      annee: 2026,
      valides: ['rsa:2026-T1', 'rsa:2026-T2', 'rsa:2025-T4', 'circulation:vert:2026-03-12:facture:a'],
      restants: ['rsa:2026-T3', 'circulation:rose:2025-12-01:vente:b'],
      bilan: { etat: 'bientot', echeance: '2027-01-01', jours: 60 },
    });
    expect(r).toEqual({ faits: 3, total: 5 });
  });

  it('un bilan sanitaire à jour compte comme fait', () => {
    expect(progressionPapiers({ annee: 2026, valides: [], restants: [], bilan: { etat: 'valide' } })).toEqual({ faits: 1, total: 1 });
  });
});

describe('aliments restants', () => {
  const m = (date: string, delta: number, article = 'aliment:mais'): MouvementStock =>
    ({ id: `${date}${delta}`, article, date, delta, origine: 'manuel' }) as unknown as MouvementStock;
  const aliments = new Set(['aliment:mais']);

  it('le stock, et les jours qu’il tient d’après ce qui s’est consommé ces 90 derniers jours', () => {
    // 1000 kg achetés, 300 consommés en 30 jours : 10 kg par jour, il reste 700 kg = 70 jours.
    const r = autonomieAliments([m('2026-09-19', 1000), m('2026-09-19', -150), m('2026-10-19', -150)], aliments, '2026-10-19');
    expect(r).toEqual({ kg: 700, jours: 70 });
  });

  it('sans consommation notée, seul le stock est connu', () => {
    expect(autonomieAliments([m('2026-10-01', 500)], aliments, '2026-10-19')).toEqual({ kg: 500 });
  });

  it('ignore les autres articles', () => {
    expect(autonomieAliments([m('2026-10-01', 500, 'fromage:frais')], aliments, '2026-10-19')).toEqual({ kg: 0 });
  });
});
