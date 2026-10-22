import { describe, expect, it } from 'vitest';
import {
  avecDossier,
  avecDossierRenomme,
  cheminDuDossier,
  contenusDuDossier,
  dossiersEnfants,
  nombreDeContenus,
  sansDossier,
} from '@/features/exploitation/services/dossiersDeContenus';
import type { ContenuGroupement, Controle } from '@/features/exploitation/types';

const contenu = (id: string, extra: Partial<ContenuGroupement> = {}): ContenuGroupement => ({ id, titre: id, date: '2026-01-01', ...extra });
const entree = (extra: Partial<Controle> = {}): Controle => ({ id: 'e1', date: '2026-01-01', type: 'Casgiu', ...extra }) as Controle;

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
