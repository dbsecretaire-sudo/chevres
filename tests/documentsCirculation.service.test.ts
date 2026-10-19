import { describe, expect, it } from 'vitest';
import {
  anneesDesEcritures,
  documentsManquants,
  ecrituresACirculation,
  rechercherEcritures,
} from '@/features/comptabilite/services/documentsCirculation';
import type { Facture, Vente } from '@/features/comptabilite/types';

const vente = (extra: Partial<Vente>): Vente =>
  ({ id: 'v', date: '2026-03-01', categorie: 'animal_vivant', animaux: 'a;b', client: 'Martin', prix: 120, ...extra }) as unknown as Vente;
const facture = (extra: Partial<Facture>): Facture =>
  ({ id: 'f', date: '2026-02-25', type: 'recue', tiers: 'SMAC Abattoir', montant: 85.66, description: '26020367', ...extra }) as unknown as Facture;

describe('documents de circulation à déposer', () => {
  const abattoirs = new Set(['smac abattoir']);

  it('les ventes déclarées d’animaux vivants, les achats d’animaux et les dépenses d’un abattoir', () => {
    const liste = ecrituresACirculation(
      [vente({ id: 'v1' }), vente({ id: 'v2', animaux: undefined }), vente({ id: 'v3', choixFacture: 'sans_facture' })],
      [
        facture({ id: 'f1' }),
        facture({ id: 'f2', tiers: 'Casanova', animauxAchetes: 'x;y' }),
        facture({ id: 'f3', tiers: 'Autre', date: '2026-01-02' }),
        facture({ id: 'f4', type: 'emise' }),
      ],
      abattoirs,
    );
    expect(liste.map((e) => e.cle)).toEqual(['vente:v1', 'facture:f1', 'facture:f2']);
    // Une dépense est en négatif, une vente en positif.
    expect(liste.find((e) => e.cle === 'facture:f1')?.montant).toBeCloseTo(-85.66);
    expect(liste.find((e) => e.cle === 'vente:v1')?.montant).toBe(120);
  });

  it('seuls les documents manquants et assez récents sont rappelés', () => {
    const piece = { id: 'p', nom: 'scan.pdf', extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-03-02' };
    const liste = ecrituresACirculation(
      [
        vente({ id: 'v1', documentCirculation: { piece, deposeLe: '2026-03-02T10:00:00.000Z' } }),
        vente({ id: 'v2', date: '2026-02-01' }),
        vente({ id: 'v3', date: '2024-01-01' }),
      ],
      [],
      abattoirs,
    );
    expect(documentsManquants(liste, '2026-10-18').map((e) => e.id)).toEqual(['v2']);
  });

  it('la recherche trouve le tiers, la référence, la date ou le montant', () => {
    const liste = ecrituresACirculation([vente({ id: 'v1' })], [facture({ id: 'f1' })], abattoirs);
    expect(rechercherEcritures(liste, 'smac').map((e) => e.id)).toEqual(['f1']);
    expect(rechercherEcritures(liste, '26020367').map((e) => e.id)).toEqual(['f1']);
    expect(rechercherEcritures(liste, '01/03/2026').map((e) => e.id)).toEqual(['v1']);
    expect(rechercherEcritures(liste, '85,66').map((e) => e.id)).toEqual(['f1']);
    expect(rechercherEcritures(liste, '  ')).toHaveLength(2);
  });

  it('les années proposées, de la plus récente à la plus ancienne', () => {
    const liste = ecrituresACirculation([vente({ id: 'a', date: '2024-05-01' }), vente({ id: 'b', date: '2026-05-01' })], [], abattoirs);
    expect(anneesDesEcritures(liste)).toEqual([2026, 2024]);
  });
});

describe('documents manquants de toutes les années', () => {
  it('compte aussi ceux qui sont plus anciens que douze mois', async () => {
    const { documentsManquantsToutesAnnees } = await import('@/features/comptabilite/services/documentsCirculation');
    const ecriture = (id: string, date: string, depose?: boolean) =>
      ({ cle: id, type: 'vente', id, date, tiers: 'X', reference: '', montant: 1, activite: 'caprin', depose: depose ? { piece: {}, deposeLe: '2026-01-01' } : undefined }) as never;
    const liste = [ecriture('recent', '2026-05-01'), ecriture('ancien', '2023-12-26'), ecriture('fait', '2023-12-27', true)];
    expect(documentsManquantsToutesAnnees(liste).map((e: { id: string }) => e.id)).toEqual(['recent', 'ancien']);
  });
});
