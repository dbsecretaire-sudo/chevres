import { describe, expect, it } from 'vitest';
import {
  dossiersDeLaRecette,
  estRecetteDAide,
  paiementsDeLAide,
  recettesDAide,
  totalDesPaiements,
} from '@/features/exploitation/services/aides';
import type { Facture } from '@/features/comptabilite/types';
import type { Controle } from '@/features/exploitation/types';

const facture = (id: string, plus: Partial<Facture>): Facture =>
  ({ id, type: 'emise', categorieRecette: 'aide', tiers: 'ODARC', date: '2026-01-01', montant: 100, description: '', ...plus }) as unknown as Facture;

describe('aides rangées chez un organisme', () => {
  it('une recette d’aide est une facture émise de la catégorie Aide', () => {
    expect(estRecetteDAide(facture('a', {}))).toBe(true);
    expect(estRecetteDAide(facture('b', { categorieRecette: 'fromage' }))).toBe(false);
    expect(estRecetteDAide(facture('c', { type: 'recue' }))).toBe(false);
  });

  it('les recettes d’aide à lier : les plus récentes d’abord', () => {
    const liste = recettesDAide([facture('a', { date: '2026-01-01' }), facture('b', { date: '2026-06-01' }), facture('x', { categorieRecette: 'lait' })]);
    expect(liste.map((f) => f.id)).toEqual(['b', 'a']);
  });

  it('les paiements d’une aide et leur total (acompte et solde)', () => {
    const factures = [facture('a', { date: '2026-03-01', montant: 1200.5 }), facture('b', { date: '2026-12-01', montant: 800.25 }), facture('c', {})];
    const paiements = paiementsDeLAide({ ecrituresLiees: ['b', 'a', 'disparue'] }, factures);
    expect(paiements.map((f) => f.id)).toEqual(['a', 'b']);
    expect(totalDesPaiements(paiements)).toBe(2000.75);
    expect(paiementsDeLAide({}, factures)).toEqual([]);
  });

  it('retrouve le dossier d’aide qui lie une recette, avec son partenaire', () => {
    const controles = [
      {
        id: 'g1',
        famille: 'groupement',
        type: 'ODARC',
        contenus: [
          { id: 'c1', titre: 'ICHN 2026', nature: 'aide', ecrituresLiees: ['a'] },
          { id: 'c2', titre: 'Courrier', nature: 'courrier_courriel', ecrituresLiees: ['a'] },
        ],
      },
      { id: 'g2', famille: 'surface', type: 'X', contenus: [{ id: 'c3', titre: 'Autre', nature: 'aide', ecrituresLiees: ['a'] }] },
    ] as unknown as Controle[];
    const dossiers = dossiersDeLaRecette('a', controles);
    expect(dossiers).toHaveLength(1);
    expect(dossiers[0]).toMatchObject({ groupementId: 'g1', partenaire: 'ODARC' });
    expect(dossiers[0].contenu.titre).toBe('ICHN 2026');
    expect(dossiersDeLaRecette('z', controles)).toEqual([]);
  });
});
