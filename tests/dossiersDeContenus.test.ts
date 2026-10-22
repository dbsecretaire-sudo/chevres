import { describe, expect, it } from 'vitest';
import {
  avecDossier,
  avecDossierRenomme,
  avecDossierTouristique,
  dossiersTouristiques,
  cheminDuDossier,
  contenusDuDossier,
  dossiersEnfants,
  nombreDeContenus,
  rechercherDansLesContenus,
  sansDossier,
} from '@/features/exploitation/services/dossiersDeContenus';
import type { ContenuGroupement, Controle } from '@/features/exploitation/types';

const contenu = (id: string, extra: Partial<ContenuGroupement> = {}): ContenuGroupement => ({
  id,
  titre: id,
  date: '2026-01-01',
  ...extra,
});
const entree = (extra: Partial<Controle> = {}): Controle =>
  ({ id: 'e1', date: '2026-01-01', type: 'Casgiu', ...extra }) as Controle;

describe('dossiers de contenus d’une association', () => {
  it('crée un dossier à la racine puis dans un autre, et retrouve son chemin', () => {
    let e = avecDossier(entree(), 'Courriers');
    const racine = e.dossiers![0];
    e = avecDossier(e, ' Aides ', racine.id);
    const enfant = e.dossiers![1];
    expect(enfant.nom).toBe('Aides');
    expect(dossiersEnfants(e.dossiers).map((d) => d.nom)).toEqual(['Courriers']);
    expect(dossiersEnfants(e.dossiers, racine.id).map((d) => d.nom)).toEqual(['Aides']);
    expect(cheminDuDossier(e.dossiers, enfant.id).map((d) => d.nom)).toEqual(['Courriers', 'Aides']);
  });

  it('range les contenus par dossier, du plus récent au plus ancien', () => {
    const contenus = [
      contenu('a', { dossierId: 'd1', date: '2026-01-01' }),
      contenu('b', { dossierId: 'd1', date: '2026-03-01' }),
      contenu('c'),
    ];
    expect(contenusDuDossier(contenus, 'd1').map((c) => c.id)).toEqual(['b', 'a']);
    expect(contenusDuDossier(contenus).map((c) => c.id)).toEqual(['c']);
  });

  it('compte les contenus d’un dossier et de ses dossiers', () => {
    const e = entree({
      dossiers: [
        { id: 'd1', nom: 'A' },
        { id: 'd2', nom: 'B', parentId: 'd1' },
      ],
      contenus: [contenu('a', { dossierId: 'd1' }), contenu('b', { dossierId: 'd2' }), contenu('c')],
    });
    expect(nombreDeContenus(e, 'd1')).toBe(2);
    expect(nombreDeContenus(e, 'd2')).toBe(1);
  });

  it('renomme un dossier', () => {
    const e = avecDossierRenomme(entree({ dossiers: [{ id: 'd1', nom: 'A' }] }), 'd1', ' Nouveau ');
    expect(e.dossiers![0].nom).toBe('Nouveau');
  });

  it('supprime un dossier sans rien perdre : son contenu remonte d’un cran', () => {
    const e = sansDossier(
      entree({
        dossiers: [
          { id: 'd1', nom: 'A' },
          { id: 'd2', nom: 'B', parentId: 'd1' },
        ],
        contenus: [contenu('a', { dossierId: 'd1' }), contenu('b', { dossierId: 'd2' })],
      }),
      'd1',
    );
    expect(e.dossiers).toEqual([{ id: 'd2', nom: 'B', parentId: undefined }]);
    expect(e.contenus!.find((c) => c.id === 'a')!.dossierId).toBeUndefined();
    expect(e.contenus!.find((c) => c.id === 'b')!.dossierId).toBe('d2');
  });
});

describe('recherche dans les dossiers et contenus', () => {
  const entree = {
    dossiers: [
      { id: 'd1', nom: 'Route des Sens Authentiques' },
      { id: 'd2', nom: 'Clôtures', parentId: 'd1' },
      { id: 'd3', nom: 'Tank à lait' },
    ],
    contenus: [
      { id: 'c1', titre: 'Cahier des charges', date: '2026-02-01', dossierId: 'd1' },
      { id: 'c2', titre: 'Devis clôture électrique', date: '2026-03-01', dossierId: 'd2' },
      { id: 'c3', titre: 'Devis tank', date: '2026-04-01', dossierId: 'd3' },
    ],
  };
  it('trouve sans tenir compte des accents ni des majuscules, à tous les niveaux', () => {
    const r = rechercherDansLesContenus(entree, 'CLOTURE');
    expect(r.dossiers.map((d) => d.id)).toEqual(['d2']);
    expect(r.contenus.map((c) => c.id)).toEqual(['c2']);
  });
  it('se limite au dossier ouvert et à ce qu’il contient', () => {
    expect(rechercherDansLesContenus(entree, 'devis', 'd1').contenus.map((c) => c.id)).toEqual(['c2']);
    expect(rechercherDansLesContenus(entree, 'devis').contenus.map((c) => c.id)).toEqual(['c3', 'c2']);
  });
  it('ne trouve rien sans mot', () => {
    expect(rechercherDansLesContenus(entree, '  ')).toEqual({ dossiers: [], contenus: [] });
  });
});

describe('dossiers touristiques', () => {
  const entree = (id: string, dossiers: { id: string; nom: string; touristique?: boolean }[]) =>
    ({ id, dossiers }) as unknown as Controle;
  it('un dossier se marque touristique, et se démarque', () => {
    const e = entree('e', [{ id: 'd1', nom: 'Route des Sens Authentiques' }]);
    const marque = avecDossierTouristique(e, 'd1', true);
    expect(marque.dossiers?.[0].touristique).toBe(true);
    expect(avecDossierTouristique(marque, 'd1', false).dossiers?.[0]).toEqual({
      id: 'd1',
      nom: 'Route des Sens Authentiques',
    });
  });
  it('un nouveau dossier peut naître touristique', () => {
    const e = avecDossier(entree('e', []), ' Route ', undefined, true);
    expect(e.dossiers?.[0]).toMatchObject({ nom: 'Route', touristique: true });
    expect(avecDossier(entree('e', []), 'Autre').dossiers?.[0].touristique).toBeUndefined();
  });
  it('liste les dossiers touristiques de toutes les entrées, par nom', () => {
    const liste = dossiersTouristiques([
      entree('a', [
        { id: '1', nom: 'Zèbre', touristique: true },
        { id: '2', nom: 'Non' },
      ]),
      entree('b', [{ id: '3', nom: 'Route', touristique: true }]),
    ]);
    expect(liste.map((x) => [x.entree.id, x.dossier.nom])).toEqual([
      ['b', 'Route'],
      ['a', 'Zèbre'],
    ]);
  });
});
