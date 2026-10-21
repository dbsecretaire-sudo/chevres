import { describe, expect, it } from 'vitest';
import { rappelsEnvoiCirculation } from '@/features/rappels/services/rappelsCirculation';
import { libelleDeRappel, periodeDeRappel } from '@/features/rappels/services/rappels';
import type { EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';

const ecriture = (id: string, date: string, nature: EcritureACirculation['nature']): EcritureACirculation => ({
  cle: `${nature === 'vente' ? 'vente' : 'facture'}:${id}`,
  type: nature === 'vente' ? 'vente' : 'facture',
  id,
  date,
  tiers: 'Martin',
  reference: '',
  montant: 100,
  activite: 'chevre',
  nature,
  liees: [],
});

describe('rappels d’envoi des documents de circulation', () => {
  const aujourdhui = '2026-10-19';
  const ecritures = [
    ecriture('a', '2026-10-10', 'achat'),
    ecriture('b', '2026-10-12', 'abattoir'),
    ecriture('c', '2026-10-15', 'vente'),
    ecriture('d', '2026-01-02', 'vente'),
    ecriture('e', '2026-11-30', 'vente'),
  ];

  it('vert pour un achat, rose pour un abattoir ou une recette ; toutes les années y sont, mais pas les écritures à venir', () => {
    const r = rappelsEnvoiCirculation(ecritures, [], aujourdhui);
    expect(r.map((x) => x.libelle)).toEqual([
      'Envoyer le document du 02/01/2026 (rose) à la chambre d’agriculture',
      'Envoyer le document du 10/10/2026 (vert) à la chambre d’agriculture',
      'Envoyer le document du 12/10/2026 (rose) à la chambre d’agriculture',
      'Envoyer le document du 15/10/2026 (rose) à la chambre d’agriculture',
    ]);
    expect(r[1].cible).toContain('ecriture=facture%3Aa');
    expect(r.every((x) => !x.enRetard)).toBe(true);
  });

  it('un rappel validé disparaît, et reste lisible dans l’historique', () => {
    const [premier] = rappelsEnvoiCirculation(ecritures, [], aujourdhui);
    expect(rappelsEnvoiCirculation(ecritures, [premier.id], aujourdhui)).toHaveLength(3);
    expect(libelleDeRappel(premier.id)).toBe('Envoyer le document du 02/01/2026 (rose) à la chambre d’agriculture');
    expect(periodeDeRappel(premier.id)).toBe(202601);
  });
});
