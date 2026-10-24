import { describe, expect, it } from 'vitest';
import {
  ajouterUnDocumentGds,
  documentsGds,
  remplacerUnDocumentGds,
  retirerUnDocumentGds,
} from '@/features/sante/services/gds';

const document = (nom: string) => ({
  piece: { id: nom, nom, extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-21' },
  deposeLe: '2026-10-21T10:00:00.000Z',
});

describe('les documents du groupement sanitaire', () => {
  it('une rubrique en garde plusieurs, dans l’ordre du dépôt, sans toucher aux autres', () => {
    let gds = ajouterUnDocumentGds(undefined, 'bons_delivrance', document('a'));
    gds = ajouterUnDocumentGds(gds, 'bons_delivrance', document('b'));
    gds = ajouterUnDocumentGds(gds, 'biosecurite', document('bio'));
    expect(documentsGds(gds, 'bons_delivrance').map((d) => d.piece.id)).toEqual(['a', 'b']);
    expect(documentsGds(gds, 'biosecurite')).toHaveLength(1);
    expect(documentsGds(gds, 'quarantaine')).toEqual([]);
  });

  it('remplace un document à sa place, et en retire un ; sans document, la rubrique disparaît', () => {
    let gds = ajouterUnDocumentGds(undefined, 'bons_delivrance', document('a'));
    gds = ajouterUnDocumentGds(gds, 'bons_delivrance', document('b'));
    gds = remplacerUnDocumentGds(gds, 'bons_delivrance', 'a', document('c'));
    expect(documentsGds(gds, 'bons_delivrance').map((d) => d.piece.id)).toEqual(['c', 'b']);
    gds = retirerUnDocumentGds(gds, 'bons_delivrance', 'c');
    gds = retirerUnDocumentGds(gds, 'bons_delivrance', 'b');
    expect(gds.documents).toEqual({});
  });

  it('lit un document unique d’une ancienne sauvegarde', () => {
    expect(documentsGds({ documents: { biosecurite: document('vieux') } }, 'biosecurite').map((d) => d.piece.id)).toEqual(['vieux']);
  });
});
