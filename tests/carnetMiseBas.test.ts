import { describe, expect, it } from 'vitest';
import {
  carnetMiseBasHtml,
  LIGNES_PAR_PAGE,
  ligneDeLaPortee,
  ordreDuLivret,
  lignesDeLAnnee,
  pagesDeLAnnee,
  porteesAvecBoucle,
  pagesDeLignes,
  porteesParAnnee,
  resultatsDeLAnnee,
} from '@/features/export/carnetMiseBasPdf';
import { lirePoids, poidsTotal } from '@/features/cheptel/utils/poids';
import type { PorteeNaissance } from '@/features/cheptel/repository/naissances';
import type { Chevre } from '@/features/cheptel/types';

const petit = (sexe: 'F' | 'M', extra: Partial<Chevre> = {}): Chevre =>
  ({ id: Math.random().toString(), sexe, statut: 'vivante', dateNaissance: '2026-03-05', ...extra }) as unknown as Chevre;
const portee = (date: string, mere: string, cabrits: Chevre[]): PorteeNaissance => ({ date, mereNumeroBoucle: mere, cabrits });

describe('carnet de mise bas', () => {
  it('une ligne par mise bas : date, boucle, mère, sexe', () => {
    expect(ligneDeLaPortee(portee('2026-03-05', '10042', [petit('F', { numeroBoucle: '20001' })]))).toEqual({
      date: '05/03',
      numero: '20001',
      mere: '10042',
      sexe: 'F',
      observations: '',
      age: '',
      poids: '',
    });
  });

  it('plusieurs petits sur la même ligne : leurs sexes et leurs boucles réunis par « + »', () => {
    const ligne = ligneDeLaPortee(
      portee('2026-03-05', '10042', [
        petit('M', { numeroBoucle: '20001' }),
        petit('F', { numeroBoucle: '20002' }),
        petit('F', { numeroBoucle: '20003' }),
      ]),
    );
    expect([ligne.sexe, ligne.numero]).toEqual(['M + F + F', '20001 + 20002 + 20003']);
  });

  it('un petit mort ou vendu : son devenir en observation et son âge ; avec plusieurs petits, précédé de sa boucle', () => {
    const seul = ligneDeLaPortee(portee('2026-03-05', 'a', [petit('F', { numeroBoucle: '1', statut: 'morte', dateStatut: '2026-03-12' })]));
    expect([seul.observations, seul.age]).toEqual(['', '7 j']);
    const jumeaux = ligneDeLaPortee(
      portee('2026-03-05', 'a', [
        petit('M', { numeroBoucle: '1', statut: 'vendue', dateStatut: '2026-05-04' }),
        petit('F', { numeroBoucle: '2' }),
      ]),
    );
    expect([jumeaux.observations, jumeaux.age]).toEqual(['1 : V', '1 : 2 mois']);
    expect(ligneDeLaPortee(portee('2026-03-05', '', [petit('M', { statut: 'mortne' })])).mere).toBe('inconnue');
  });

  it('le poids donné par l’abattoir s’écrit dans la colonne « poids départ »', () => {
    expect(ligneDeLaPortee(portee('2026-03-05', 'a', [petit('M', { numeroBoucle: '1', poidsKg: 9.5 })])).poids).toBe('9,5 kg');
    const deux = ligneDeLaPortee(
      portee('2026-03-05', 'a', [petit('M', { numeroBoucle: '1', poidsKg: 8 }), petit('F', { numeroBoucle: '2' })]),
    );
    expect(deux.poids).toBe('1 : 8 kg');
    expect(ligneDeLaPortee(portee('2026-03-05', 'a', [petit('F', { numeroBoucle: '3' })])).poids).toBe('');
  });

  it('un poids se lit avec une virgule ou un point', () => {
    expect([lirePoids('9,5'), lirePoids(' 12.25 '), lirePoids(''), lirePoids('abc'), lirePoids('0'), lirePoids('-3')]).toEqual([
      9.5,
      12.25,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('le poids total de plusieurs animaux : seulement quand chacun a le sien', () => {
    expect(poidsTotal([{ poidsKg: 8.5 }, { poidsKg: 9.25 }])).toBe(17.75);
    expect(poidsTotal([{ poidsKg: 8 }, {}])).toBeUndefined();
    expect(poidsTotal([])).toBeUndefined();
  });

  it('les mises bas d’une année sont rangées par date de naissance, chacune sur sa ligne', () => {
    const lignes = lignesDeLAnnee([
      portee('2026-05-01', 'b', [petit('M', { numeroBoucle: '1' })]),
      portee('2026-02-10', 'z', [petit('F', { numeroBoucle: '2' }), petit('M', { numeroBoucle: '3' })]),
      portee('2026-02-10', 'a', [petit('F', { numeroBoucle: '4' })]),
    ]);
    // Tri sur la date seule : à date égale, l'ordre de saisie est gardé (la mère « z » avant la mère « a »).
    expect(lignes.map((l) => [l.date, l.mere, l.sexe])).toEqual([
      ['10/02', 'z', 'F + M'],
      ['10/02', 'a', 'F'],
      ['01/05', 'b', 'M'],
    ]);
  });

  it('32 lignes par page A4, la dernière page complétée de lignes vides', () => {
    const ligne = ligneDeLaPortee(portee('2026-03-05', 'a', [petit('F')]));
    expect(LIGNES_PAR_PAGE).toBe(32);
    expect(pagesDeLignes([]).map((p) => p.length)).toEqual([32]);
    expect(pagesDeLignes(Array(32).fill(ligne)).map((p) => p.length)).toEqual([32]);
    expect(pagesDeLignes(Array(33).fill(ligne)).map((p) => p.length)).toEqual([32, 32]);
  });

  it('livret : l’ordre des pages sur les feuilles recto verso pliées en deux', () => {
    expect(ordreDuLivret(4)).toEqual([[3, 0], [1, 2]]);
    expect(ordreDuLivret(8)).toEqual([[7, 0], [1, 6], [5, 2], [3, 4]]);
    // Complété au multiple de 4.
    expect(ordreDuLivret(5)).toEqual(ordreDuLivret(8));
  });

  it('le livret a des feuilles A4 de deux demi-pages, et 18 lignes par page', () => {
    const html = carnetMiseBasHtml([portee('2026-05-01', 'b', [petit('M', { numeroBoucle: '1' })])], undefined, undefined, 'livret');
    expect(html).toContain('class="livret"');
    expect((html.match(/class="feuille"/g) ?? []).length).toBe(4);
    expect((html.match(/class="demi"/g) ?? []).length).toBe(8);
    expect(pagesDeLignes([], 18)[0]).toHaveLength(18);
  });

  it('une page vide sépare les naissances du début d’année de celles de fin d’année', () => {
    const debut = portee('2026-02-10', 'a', [petit('F', { dateNaissance: '2026-02-10' })]);
    const fin = portee('2026-11-02', 'b', [petit('M', { dateNaissance: '2026-11-02' })]);
    const pages = pagesDeLAnnee([fin, debut]);
    expect(pages).toHaveLength(3);
    expect(pages.map((p) => p.filter((l) => l.date).length)).toEqual([1, 0, 1]);
    expect(pages[0][0].date).toBe('10/02');
    expect(pages[2][0].date).toBe('02/11');
    // Sans naissance de fin d’année : le début, puis la page vide.
    expect(pagesDeLAnnee([debut])).toHaveLength(2);
  });

  it('les petits sans boucle ne sont pas dans le carnet, ni leur mise bas quand aucun petit n’a de boucle', () => {
    const gardees = porteesAvecBoucle([
      portee('2026-03-05', 'a', [petit('F', { numeroBoucle: '20001' }), petit('M'), petit('F', { numeroBoucle: '  ' })]),
      portee('2026-03-06', 'b', [petit('M', { statut: 'mortne' })]),
    ]);
    expect(gardees).toHaveLength(1);
    expect(gardees[0].cabrits.map((c) => c.numeroBoucle)).toEqual(['20001']);
    const html = carnetMiseBasHtml([portee('2026-03-06', 'b', [petit('M')])]);
    expect(html).toContain('Aucune');
    expect(html).not.toContain('Cabris — 2026');
  });

  it('range les mises bas par année, la plus récente d’abord', () => {
    const annees = porteesParAnnee([portee('2025-04-02', 'a', [petit('F')]), portee('2026-05-01', 'b', [petit('M')])]);
    expect(annees.map((a) => a.annee)).toEqual(['2026', '2025']);
  });

  it('résultats : petits nés simples, doubles, triples, morts selon l’âge, taux', () => {
    const r = resultatsDeLAnnee([
      portee('2026-03-05', 'a', [petit('F')]),
      portee('2026-03-06', 'b', [petit('F'), petit('M', { statut: 'mortne' })]),
      portee('2026-03-07', 'c', [
        petit('F', { dateNaissance: '2026-03-07' }),
        petit('M', { dateNaissance: '2026-03-07', statut: 'morte', dateStatut: '2026-03-09' }),
        petit('M', { dateNaissance: '2026-03-07', statut: 'morte', dateStatut: '2026-04-20' }),
      ]),
    ]);
    expect(r).toMatchObject({
      misesBas: 3,
      simples: 1,
      doubles: 2,
      triplesEtPlus: 3,
      nes: 6,
      mortsNaissance: 1,
      mortsSemaine: 1,
      mortsSevrage: 1,
      mortsDepart: 0,
      morts: 3,
      vivants: 3,
      prolificite: 200,
      mortalite: 50,
    });
  });

  it('le carnet commence par les données personnelles, puis les petits et les résultats de chaque année', () => {
    const html = carnetMiseBasHtml([portee('2026-05-01', 'b', [petit('M', { numeroBoucle: '1' }), petit('F', { numeroBoucle: '2' })])], {
      nomExploitant: 'Riolacci Joseph',
      numeroExploitation: 'FR20213003',
    } as never);
    expect(html).toContain('Mes données personnelles');
    expect(html).toContain('Riolacci');
    expect(html).toContain('Cabris — 2026');
    expect(html).toContain('Résultats de production — 2026');
    expect(html).toContain('Taux de prolificité');
    expect(carnetMiseBasHtml([])).toContain('Aucune');
  });
});
