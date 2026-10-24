import { describe, expect, it } from 'vitest';
import { changementsDesAnimauxEnleves, enlevementsDepuisLesLots, enlevementsSansBon } from '@/features/lots-animaux/services/enlevements';
import { statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { EnlevementEquarrissage, LotAnimaux } from '@/features/settings/settings';

const lot = (extra: Partial<LotAnimaux>): LotAnimaux => ({ id: 'l', nom: 'Lot', boucles: '', ...extra });
const enlevement = (extra: Partial<EnlevementEquarrissage>): EnlevementEquarrissage => ({ id: 'e', date: '2026-03-10', boucles: '', ...extra });
const piece = { id: 'p', nom: 'bon.pdf', extension: 'pdf', mime: 'application/pdf', ajoutLe: '2026-10-22' };

describe('rappel du bon d’équarrissage', () => {
  it('ne rappelle que les enlèvements sans fichier joint', () => {
    const liste = [enlevement({ id: 'a' }), enlevement({ id: 'b', fichiers: [piece] })];
    expect(enlevementsSansBon(liste).map((e) => e.id)).toEqual(['a']);
  });

  it('sans enlèvement, rien à rappeler', () => {
    expect(enlevementsSansBon(undefined)).toEqual([]);
  });
});

describe('les anciens lots d’équarrissage deviennent des enlèvements', () => {
  it('le jour, l’équarrisseur, le n° du bon, les boucles et le bon sont repris ; le lot disparaît, les autres restent', () => {
    const lots = [
      lot({ id: 'a', categorie: 'equarrissage', dateEnlevement: '2026-03-10', contactCle: 'f1', numeroBon: '4521', boucles: '10001, 10002', fichiers: [piece] }),
      lot({ id: 'b', categorie: 'abattoir' }),
      lot({ id: 'c' }),
    ];
    const r = enlevementsDepuisLesLots(lots, []);
    expect(r?.lots.map((l) => l.id)).toEqual(['b', 'c']);
    expect(r?.enlevements).toEqual([
      { id: 'a', date: '2026-03-10', boucles: '10001, 10002', contactCle: 'f1', numeroBon: '4521', fichiers: [piece] },
    ]);
  });

  it('sans ancien lot, rien à changer ; un enlèvement déjà converti n’est pas refait', () => {
    expect(enlevementsDepuisLesLots([lot({ id: 'c' })], [])).toBeNull();
    const r = enlevementsDepuisLesLots([lot({ id: 'a', categorie: 'equarrissage' })], [enlevement({ id: 'a', numeroBon: 'déjà' })]);
    expect(r?.enlevements).toHaveLength(1);
    expect(r?.enlevements[0].numeroBon).toBe('déjà');
  });
});

describe('les animaux d’un enlèvement', () => {
  const animal = (id: string, numeroBoucle: string, extra: Record<string, unknown> = {}) => ({ id, numeroBoucle, statut: 'vivante', ...extra });
  const enl = (boucles: string, date = '2026-10-24') => ({ id: 'e1', date, boucles });

  it('les animaux choisis passent à « mort » au jour de l’enlèvement, les autres ne bougent pas', () => {
    const animaux = [animal('a', '10001'), animal('b', '10002'), animal('c', '10003')];
    expect(changementsDesAnimauxEnleves(undefined, enl('10001, 10002'), animaux)).toEqual([
      { id: 'a', enleve: true },
      { id: 'b', enleve: true },
    ]);
  });

  it('un animal déjà à jour n’est pas refait ; un autre jour le change', () => {
    const fait = animal('a', '10001', { statut: 'morte', dateStatut: '2026-10-24', enlevementId: 'e1' });
    expect(changementsDesAnimauxEnleves(enl('10001'), enl('10001'), [fait])).toEqual([]);
    expect(changementsDesAnimauxEnleves(enl('10001'), enl('10001', '2026-10-25'), [fait])).toEqual([{ id: 'a', enleve: true }]);
  });

  it('un animal retiré de l’enlèvement perd le lien, un enlèvement supprimé les libère tous', () => {
    const a = animal('a', '10001', { statut: 'morte', dateStatut: '2026-10-24', enlevementId: 'e1' });
    const b = animal('b', '10002', { statut: 'morte', dateStatut: '2026-10-24', enlevementId: 'e1' });
    expect(changementsDesAnimauxEnleves(enl('10001, 10002'), enl('10001'), [a, b])).toEqual([{ id: 'b', enleve: false }]);
    expect(changementsDesAnimauxEnleves(enl('10001, 10002'), null, [a, b])).toEqual([
      { id: 'a', enleve: false },
      { id: 'b', enleve: false },
    ]);
  });

  it('l’animal enlevé s’affiche « Équarrissage », un animal mort autrement « Morte »', () => {
    expect(statutLabel('morte', 'F', true)).toBe('Équarrissage');
    expect(statutLabel('morte', 'F')).toBe('Morte');
    expect(statutLabel('vendue', 'F', true)).toBe('Vendue');
  });
});
