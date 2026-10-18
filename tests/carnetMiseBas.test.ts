import { describe, expect, it } from 'vitest';
import {
  carnetMiseBasHtml,
  LIGNES_PAR_PAGE,
  facesA4DuLivret,
  ligneDeLaPortee,
  ordreDuLivret,
  lignesDeLAnnee,
  pagesDeLAnnee,
  pagesA4DeLAnnee,
  pagesA4DeLignes,
  hauteurDeLaLigne,
  HAUTEUR_UTILE_A4_MM,
  porteesAvecBoucle,
  chevresMisesALaReproduction,
  pagesDeLignes,
  porteesParAnnee,
  resultatsDeLAnnee,
} from '@/features/export/carnetMiseBasPdf';
import { lirePoids, poidsTotal } from '@/features/cheptel/utils/poids';
import { lotsDeReproductionDeLAnnee } from '@/features/exploitation/services/lots';
import type { LotAnimaux } from '@/features/settings/settings';
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
    expect([ligne.sexe, ligne.numero]).toEqual(['M + F + F', '20001\n20002\n20003']);
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

  it('un départ après le 31 décembre de l’année de naissance n’apparaît pas dans le carnet de cette année', () => {
    const l = ligneDeLaPortee(
      portee('2024-12-30', 'a', [
        petit('F', { numeroBoucle: '30008', dateNaissance: '2024-12-30', statut: 'abattoir', dateStatut: '2026-07-30', poidsKg: 20, renouvellement: true }),
      ]),
    );
    expect(l).toMatchObject({ observations: 'R', age: '', poids: '' });
  });

  it('un cabri parti à l’abattoir encore petit (73 jours) est noté, même après la fin de l’année ; un animal gardé puis parti à 19 mois, non', () => {
    const tard = ligneDeLaPortee(
      portee('2025-12-14', 'a', [
        petit('M', { numeroBoucle: '00846', dateNaissance: '2025-12-14', statut: 'abattoir', dateStatut: '2026-02-25', poidsKg: 7.3 }),
      ]),
    );
    expect(tard).toMatchObject({ observations: 'A', age: '2 mois', poids: '7,3 kg' });
    const l = ligneDeLaPortee(
      portee('2024-12-29', 'a', [
        petit('M', { numeroBoucle: '00715', dateNaissance: '2024-12-29', statut: 'abattoir', dateStatut: '2025-02-10', poidsKg: 9 }),
      ]),
    );
    expect(l).toMatchObject({ observations: 'A', age: '43 j', poids: '9 kg' });
  });

  it('le lot de mise à la reproduction de l’année donne les chèvres mises à la reproduction ; il se crée tout seul chaque année', () => {
    const f = (boucle: string, extra: Partial<Chevre> = {}) => petit('F', { numeroBoucle: boucle, dateNaissance: '2020-03-01', ...extra });
    const animaux = [
      f('1'),
      f('2'),
      f('3'),
      f('4', { statut: 'vendue', dateStatut: '2025-11-01' }), // sortie avant le 1er janvier 2026
      f('5', { dateNaissance: '2025-09-01' }), // 4 mois au 1er janvier 2026 : pas encore à sa majorité sexuelle
      petit('M', { numeroBoucle: '9', dateNaissance: '2020-03-01' }),
    ];
    // Les lots manquants se créent : un par année, de la première naissance (2020) à l'année courante.
    const crees = lotsDeReproductionDeLAnnee(animaux, [], 2026, () => 'x') as LotAnimaux[];
    expect(crees.map((l) => [l.reproduction, l.nom])).toEqual([
      [2021, 'Mises à la reproduction 2021'],
      [2022, 'Mises à la reproduction 2022'],
      [2023, 'Mises à la reproduction 2023'],
      [2024, 'Mises à la reproduction 2024'],
      [2025, 'Mises à la reproduction 2025'],
      [2026, 'Mises à la reproduction 2026'],
    ]);
    expect(crees.find((l) => l.reproduction === 2026)?.boucles).toBe('1, 2, 3');
    expect(crees.find((l) => l.reproduction === 2025)?.boucles).toBe('1, 2, 3, 4');
    // Un lot déjà là (et corrigé à la main) n'est jamais refait ; rien à faire quand tout existe.
    const corriges = crees.map((l) => (l.reproduction === 2026 ? { ...l, boucles: '1, 2' } : l));
    expect(lotsDeReproductionDeLAnnee(animaux, corriges, 2026)).toBeNull();
    // Le carnet compte les animaux du lot de l'année ; une mère absente du lot s'y ajoute ; sans lot : le calcul d'après le cheptel.
    expect(chevresMisesALaReproduction(animaux, 2026, [], corriges)).toBe(2);
    expect(chevresMisesALaReproduction(animaux, 2026, ['3'], corriges)).toBe(3);
    expect(chevresMisesALaReproduction(animaux, 2026, [], [])).toBe(3);
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

  it('les morts des résultats sont ceux au 31 décembre de l’année : un petit mort l’année d’après est vivant', () => {
    const portees = [
      portee('2022-03-05', 'a', [
        petit('F', { dateNaissance: '2022-03-05', statut: 'morte', dateStatut: '2022-03-08' }),
        petit('M', { dateNaissance: '2022-03-05', statut: 'morte', dateStatut: '2023-02-10' }),
        petit('F', { dateNaissance: '2022-03-05' }),
      ]),
    ];
    const r = resultatsDeLAnnee(portees, 2022);
    expect(r).toMatchObject({ nes: 3, morts: 1, mortsSemaine: 1, vivants: 2 });
    // Sans année donnée, c'est celle des naissances.
    expect(resultatsDeLAnnee(portees).morts).toBe(1);
  });

  it('résultats : un petit auto-consommé compte parmi les morts, un petit vendu ou abattu non', () => {
    const r = resultatsDeLAnnee(
      [
        portee('2024-03-01', 'a', [
          petit('M', { dateNaissance: '2024-03-01', statut: 'autoconsommee', dateStatut: '2024-04-01' }),
          petit('M', { dateNaissance: '2024-03-01', statut: 'abattoir', dateStatut: '2024-04-01' }),
          petit('F', { dateNaissance: '2024-03-01', statut: 'vendue', dateStatut: '2024-05-01' }),
        ]),
      ],
      2024,
    );
    expect(r).toMatchObject({ nes: 3, morts: 1, mortsSevrage: 1, vivants: 2 });
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

  it('le livret A6 : quatre pages par face de feuille A4, tableau sur deux pages face à face, 16 lignes', () => {
    const html = carnetMiseBasHtml([portee('2026-05-01', 'b', [petit('M', { numeroBoucle: '1' })])], undefined, undefined, 'livret');
    expect(html).toContain('class="a6"');
    // 12 pages A6 : couverture, verso, données, deux doubles pages de tableau, la double page des résultats, verso et quatrième de couverture.
    // 3 feuilles A5, donc 2 feuilles A4 (recto et verso chacune).
    expect((html.match(/class="face"/g) ?? []).length).toBe(4);
    expect((html.match(/class="demi5"/g) ?? []).length).toBe(6);
    expect((html.match(/class="page6"/g) ?? []).length).toBe(12);
    // Le tableau se lit sur deux pages face à face : la date à gauche, les observations à droite (une fois par double page).
    expect((html.match(/>Observations</g) ?? []).length).toBe(2);
    expect((html.match(/>Date</g) ?? []).length).toBe(2);
    expect(html).toContain('Résultats de production');
    expect(html).toContain('Calculs des taux');
    expect(pagesDeLignes([], 16)[0]).toHaveLength(16);
  });

  it('les faces A4 du livret : deux feuilles A5 par feuille A4, recto puis verso', () => {
    // 8 pages = 2 feuilles A5 (recto [7,0] verso [1,6] ; recto [5,2] verso [3,4]) : une seule feuille A4.
    expect(facesA4DuLivret(8)).toEqual([
      { haut: [7, 0], bas: [5, 2] },
      { haut: [1, 6], bas: [3, 4] },
    ]);
    // 4 pages = 1 feuille A5 : le bas de la feuille A4 reste vide.
    expect(facesA4DuLivret(4)).toEqual([{ haut: [3, 0], bas: undefined }, { haut: [1, 2], bas: undefined }]);
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

  it('un petit sans boucle auto-consommé compte (né et mort), contrairement aux autres petits sans boucle', () => {
    const gardees = porteesAvecBoucle([
      portee('2026-03-05', 'a', [petit('F', { numeroBoucle: '20001' }), petit('M', { statut: 'autoconsommee', dateStatut: '2026-04-01' }), petit('M')]),
    ]);
    expect(gardees[0].cabrits).toHaveLength(2);
    const r = resultatsDeLAnnee(gardees, 2026);
    expect(r).toMatchObject({ nes: 2, doubles: 2, morts: 1, vivants: 1 });
  });

  it('les femelles mises à la reproduction : toutes celles présentes au 1er janvier à leur majorité sexuelle et les mères de l’année ; les taux en découlent', () => {
    const f = (extra: Partial<Chevre>) => petit('F', { numeroBoucle: '1' + Math.random(), dateNaissance: '2020-03-01', ...extra });
    const animaux = [
      f({}),
      f({}),
      f({ statut: 'vendue', dateStatut: '2025-11-01' }), // sortie avant le 1er janvier
      f({ statut: 'vendue', dateStatut: '2026-05-01' }), // encore là au 1er janvier
      f({ dateNaissance: '2025-04-01', renouvellement: true, renouvellementAnnee: 2025 }), // renouvellement, mais 9 mois : elle compte
      f({ dateNaissance: '2025-09-01' }), // 4 mois : pas encore à sa majorité sexuelle
      f({ dateNaissance: '2023-04-01', renouvellement: true, renouvellementAnnee: 2023 }), // ancienne désignation : adulte
      petit('M', { numeroBoucle: '9', dateNaissance: '2020-03-01' }), // un bouc
      f({ dateNaissance: '2026-02-01' }), // née après
    ];
    expect(chevresMisesALaReproduction(animaux, 2026)).toBe(5);
    // Une mère absente de la liste (sortie avant le 1er janvier) s'y ajoute : pas moins de chèvres mises à la reproduction que de mises bas.
    expect(chevresMisesALaReproduction(animaux, 2026, ['inconnue', 'inconnue'])).toBe(6);
    const r = resultatsDeLAnnee(
      [
        portee('2026-03-05', 'a', [petit('F', { numeroBoucle: '2', statut: 'vendue', dateStatut: '2026-09-01' })]),
        portee('2026-03-06', 'b', [petit('F', { numeroBoucle: '3', renouvellement: true }), petit('M', { numeroBoucle: '4', statut: 'abattoir', dateStatut: '2026-05-01' })]),
      ],
      2026,
      4,
    );
    expect(r).toMatchObject({ misesALaReproduction: 4, vendusOuGardes: 3, fertilite: 50, productivite: 75 });
    expect(resultatsDeLAnnee([portee('2026-03-05', 'a', [petit('F', { numeroBoucle: '2' })])], 2026).fertilite).toBeUndefined();
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

describe('carnet A4 : pages remplies jusqu’au bas', () => {
  const l = (numero: string, age = '') => ({ date: '10/02', numero, mere: '1', sexe: 'F', observations: 'A', age, poids: '' });

  it('une année sans naissance de début d’année n’a qu’une page vide avant la suite', () => {
    const fin = portee('2026-11-02', 'b', [petit('M', { dateNaissance: '2026-11-02' })]);
    expect(pagesDeLAnnee([fin])).toHaveLength(2);
    expect(pagesDeLAnnee([])).toHaveLength(1);
    expect(pagesA4DeLAnnee([fin])).toHaveLength(2);
    expect(pagesA4DeLAnnee([])).toHaveLength(1);
  });

  it('la dernière page est complétée de lignes vides, sans dépasser la hauteur d’une page', () => {
    const pages = pagesA4DeLignes([l('1'), l('2'), l('3\n4', '3 : 34 j\n4 : 34 j')]);
    expect(pages).toHaveLength(1);
    const hauteur = pages[0].reduce((t, ligne) => t + hauteurDeLaLigne(ligne), 0);
    expect(hauteur).toBeLessThanOrEqual(HAUTEUR_UTILE_A4_MM);
    // Il reste moins d'une ligne de place : la page est pleine.
    expect(HAUTEUR_UTILE_A4_MM - hauteur).toBeLessThan(7);
    // Les trois lignes saisies d'abord, puis du vide.
    expect(pages[0].slice(0, 3).map((x) => x.numero)).toEqual(['1', '2', '3\n4']);
    expect(pages[0][3].numero).toBe('');
  });

  it('des lignes plus hautes (deux petits) font passer à la page suivante plus tôt qu’au 32e', () => {
    const hautes = Array.from({ length: 30 }, (_, i) => l(`${i}a\n${i}b`, `${i}a : 34 j\n${i}b : 34 j`));
    const pages = pagesA4DeLignes(hautes);
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      expect(page.reduce((t, ligne) => t + hauteurDeLaLigne(ligne), 0)).toBeLessThanOrEqual(HAUTEUR_UTILE_A4_MM);
    }
    expect(pages.flat().filter((x) => x.numero).length).toBe(30);
  });
});
