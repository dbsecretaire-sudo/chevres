import { describe, expect, it } from 'vitest';
import type { EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import { piecesDuContact } from '@/features/contacts/services/piecesDuContact';
import type { LotAnimaux } from '@/features/settings/settings';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { CATEGORIE_LOT } from '@/shared/constants/lots';

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
  it('range les bons d’équarrissage chez l’équarrisseur, et signale le bon qui manque', () => {
    const lots = [
      lot({
        id: 'a',
        nom: 'Enlèvement mars',
        categorie: CATEGORIE_LOT.EQUARRISSAGE,
        numeroBon: '4521',
        dateEnlevement: '2026-03-10',
      }),
      lot({
        id: 'b',
        nom: 'Enlèvement juin',
        categorie: CATEGORIE_LOT.EQUARRISSAGE,
        dateEnlevement: '2026-06-02',
      }),
      lot({ id: 'c', nom: 'Autre lot', categorie: CATEGORIE_LOT.ABATTOIR }),
    ];
    const pieces = piecesDuContact(
      { nom: 'Équarrisseur', cle: 'e1' },
      CATEGORIE_FOURNISSEUR.EQUARRISSAGE,
      lots,
      [],
    );
    expect(pieces.map((p) => p.cle)).toEqual(['bon-b', 'bon-a']);
    expect(pieces[0].manque).toBe(true);
    expect(pieces[1].titre).toContain('4521');
    expect(pieces[1].route).toContain('onglet=fichiers');
  });

  it('range chez un abattoir les documents de circulation qui le concernent, avec ou sans document', () => {
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
        cle: 'lot:4',
        type: 'lot',
        id: '4',
        tiers: 'Départ d’octobre',
        date: '2026-10-05',
        liees: [
          {
            type: 'facture',
            id: 'f',
            date: '2026-10-06',
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
      [],
      ecritures,
    );
    expect(pieces.map((p) => p.cle)).toEqual([
      'circulation-lot:4',
      'circulation-facture:2',
      'circulation-vente:1',
    ]);
    expect(pieces.map((p) => p.manque)).toEqual([true, false, true]);
  });

  it('ne range rien chez les autres contacts', () => {
    expect(
      piecesDuContact(
        { nom: 'Garage', cle: 'g' },
        CATEGORIE_FOURNISSEUR.GARAGE,
        [lot({ categorie: CATEGORIE_LOT.EQUARRISSAGE })],
        [circulation({})],
      ),
    ).toEqual([]);
  });
});
