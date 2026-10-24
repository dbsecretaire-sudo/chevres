import { describe, expect, it } from 'vitest';
import type { EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import { piecesDuContact } from '@/features/contacts/services/piecesDuContact';
import type { EnlevementEquarrissage, LotAnimaux } from '@/features/settings/settings';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

const lot = (extra: Partial<LotAnimaux>): LotAnimaux => ({ id: 'l', nom: 'Lot', boucles: '', ...extra });
const circulation = (extra: Partial<EcritureACirculation>): EcritureACirculation => ({
  cle: 'vente:1',
  type: 'vente',
  id: '1',
  date: '2026-05-01',
  tiers: 'Abattoir de Corte',
  reference: 'F-12',
  montant: 0,
  activite: 'chevre',
  nature: 'abattoir',
  liees: [],
  ...extra,
});

describe('les pièces qui se rangent toutes seules dans les documents d’un contact', () => {
  const equarrisseur = { nom: 'Équarrisseur Nord', cle: 'e1', ids: ['f-e1'] };
  const bon = (extra: Partial<EnlevementEquarrissage>): EnlevementEquarrissage => ({ id: 'e', date: '', boucles: '', ...extra });

  it('range chez chaque équarrisseur les bons des lots qu’il a enlevés, et signale le bon qui manque', () => {
    const enlevements = [
      bon({ id: 'a', numeroBon: '4521', date: '2026-03-10', contactCle: 'f-e1' }),
      bon({ id: 'b', date: '2026-06-02', contactCle: 'e1' }),
      bon({ id: 'c', date: '2026-07-02', contactCle: 'autre' }),
    ];
    const pieces = piecesDuContact(equarrisseur, CATEGORIE_FOURNISSEUR.EQUARRISSAGE, [], [], enlevements);
    expect(pieces.map((p) => p.cle)).toEqual(['bon-b', 'bon-a']);
    expect(pieces[0].manque).toBe(true);
    expect(pieces[1].titre).toContain('4521');
    expect(pieces[1].route).toContain('/production/enlevement');
  });

  it('montre à chaque équarrisseur un lot sans équarrisseur choisi, en le disant', () => {
    const pieces = piecesDuContact(
      equarrisseur,
      CATEGORIE_FOURNISSEUR.EQUARRISSAGE,
      [],
      [],
      [bon({ id: 'x', date: '2026-01-01' })],
    );
    expect(pieces).toHaveLength(1);
    expect(pieces[0].detail).toContain('Équarrisseur à choisir');
  });

  it('range chez un contact les documents de circulation faits avec lui, abattoir, particulier ou éleveur', () => {
    const ecritures = [
      circulation({}),
      circulation({
        cle: 'facture:2',
        type: 'facture',
        id: '2',
        date: '2026-07-01',
        depose: { piece: {} as never, deposeLe: '2026-07-02T10:00:00Z' },
      }),
      circulation({ cle: 'vente:3', id: '3', tiers: 'Autre client' }),
      circulation({
        cle: 'vente:5',
        id: '5',
        tiers: 'Marie Particulier',
        nature: 'vente',
        date: '2026-08-01',
      }),
    ];
    const abattoir = piecesDuContact(
      { nom: 'Abattoir de Corte', cle: 'a1' },
      CATEGORIE_FOURNISSEUR.ABATTOIR,
      [],
      ecritures,
    );
    expect(abattoir.map((p) => p.cle)).toEqual(['circulation-facture:2', 'circulation-vente:1']);
    expect(abattoir.map((p) => p.manque)).toEqual([false, true]);
    const particulier = piecesDuContact({ nom: 'marie particulier', cle: 'p1' }, undefined, [], ecritures);
    expect(particulier.map((p) => p.cle)).toEqual(['circulation-vente:5']);
  });

  it('range un lot de départ chez l’abattoir choisi dans le lot, ou dont une écriture porte son nom', () => {
    const lots = [
      lot({ id: '4', nom: 'Départ d’octobre', depart: true, abattoir: '2026-10-05', contactCle: 'a1' }),
    ];
    const ecritures = [
      circulation({ cle: 'lot:4', type: 'lot', id: '4', tiers: 'Départ d’octobre', date: '2026-10-05' }),
      circulation({
        cle: 'lot:9',
        type: 'lot',
        id: '9',
        tiers: 'Départ de novembre',
        date: '2026-11-05',
        liees: [
          {
            type: 'facture',
            id: 'f',
            date: '2026-11-06',
            tiers: 'abattoir de corte ',
            reference: '',
            montant: -80,
            role: 'prestation',
          },
        ],
      }),
    ];
    const pieces = piecesDuContact(
      { nom: 'Abattoir de Corte', cle: 'a1' },
      CATEGORIE_FOURNISSEUR.ABATTOIR,
      lots,
      ecritures,
    );
    expect(pieces.map((p) => p.cle)).toEqual(['circulation-lot:9', 'circulation-lot:4']);
    expect(
      piecesDuContact({ nom: 'Abattoir B', cle: 'a2' }, CATEGORIE_FOURNISSEUR.ABATTOIR, lots, ecritures),
    ).toEqual([]);
  });

  it('ne range rien chez un contact sans équarrissage ni écriture', () => {
    expect(
      piecesDuContact(
        { nom: 'Garage', cle: 'g' },
        CATEGORIE_FOURNISSEUR.GARAGE,
        [],
        [circulation({})],
        [bon({})],
      ),
    ).toEqual([]);
  });
});
