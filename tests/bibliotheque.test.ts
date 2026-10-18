import { describe, expect, it } from 'vitest';
import { normaliserBibliotheque } from '@/features/bibliotheque/repository';
import { documentsDuType, racineDuFichier } from '@/features/bibliotheque/services/recherche';

describe('bibliothèque des documents générés', () => {
  it('ne garde que des documents complets', () => {
    const complet = {
      id: 'd1',
      titre: 'Suivi des mouvements',
      nomFichier: 'suivi.pdf',
      genereLe: '2026-10-17T14:32:00.000Z',
      piece: { id: 'p1', nom: 'suivi.pdf', extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-17' },
    };
    expect(normaliserBibliotheque([complet, { id: 'd2' }, null, 'x'])).toEqual([complet]);
    expect(normaliserBibliotheque(undefined)).toEqual([]);
  });
});

describe('documents déjà générés d’un même type', () => {
  const doc = (nomFichier: string, genereLe: string) =>
    ({ id: nomFichier + genereLe, titre: 't', nomFichier, genereLe, piece: { id: 'p', nom: nomFichier, extension: 'pdf', mime: 'application/pdf', ajoutLe: '' } }) as never;

  it('reconnaît le type d’un fichier sans son année ni sa période', () => {
    expect(racineDuFichier('plan_comptable_2026.pdf')).toBe('plan_comptable');
    expect(racineDuFichier('bordereaux_perte_2024-2026.pdf')).toBe('bordereaux_perte');
    expect(racineDuFichier('registre_cheptel_complet.pdf')).toBe('registre_cheptel_complet');
    expect(racineDuFichier('carnet_mise_bas_livret.pdf')).toBe('carnet_mise_bas_livret');
  });

  it('retrouve les documents d’un type, le plus récent d’abord', () => {
    const liste = [doc('plan_comptable_2025.pdf', '2026-10-01T10:00:00Z'), doc('inventaire.pdf', '2026-10-02T10:00:00Z'), doc('plan_comptable_2026.pdf', '2026-10-17T10:00:00Z')];
    expect(documentsDuType(liste, ['plan_comptable']).map((d) => d.nomFichier)).toEqual(['plan_comptable_2026.pdf', 'plan_comptable_2025.pdf']);
    expect(documentsDuType(liste, [undefined])).toEqual([]);
  });
});
