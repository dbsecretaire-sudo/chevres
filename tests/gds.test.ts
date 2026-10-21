import { describe, expect, it } from 'vitest';
import { poserLeDocumentGds } from '@/features/exploitation/services/gds';

const document = (nom: string) => ({
  piece: { id: nom, nom, extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-21' },
  deposeLe: '2026-10-21T10:00:00.000Z',
});

describe('les documents du groupement sanitaire', () => {
  it('pose un document sans toucher aux autres, et le retire', () => {
    const a = poserLeDocumentGds(undefined, 'attestation_pse', document('pse'));
    const b = poserLeDocumentGds(a, 'biosecurite', document('bio'));
    expect(Object.keys(b.documents ?? {}).sort()).toEqual(['attestation_pse', 'biosecurite']);
    const c = poserLeDocumentGds(b, 'attestation_pse', undefined);
    expect(Object.keys(c.documents ?? {})).toEqual(['biosecurite']);
  });
});
