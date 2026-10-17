import { describe, expect, it } from 'vitest';
import { joursAbattusAFacturer } from '@/features/comptabilite/utils/animauxVendus';
import { documentCirculationRequis, reglageEtatAnimaux, sortieDesAnimauxDeLaVente } from '@/features/comptabilite/utils/ventes';
import type { Chevre } from '@/features/cheptel/types';

const abattu = (id: string, jour: string): Chevre =>
  ({ id, sexe: 'M', statut: 'abattoir', dateStatut: jour, dateNaissance: '2026-01-01', numeroBoucle: id }) as unknown as Chevre;

describe('ventes d’animaux abattus', () => {
  it('une vente supprimée remet ses animaux abattus dans les animaux à facturer', () => {
    const animaux = [abattu('a', '2026-02-25'), abattu('b', '2026-02-25'), abattu('c', '2026-03-10')];
    const ventes = [{ id: 'v1', animaux: 'a;b' }];
    expect(joursAbattusAFacturer(animaux, ventes).map((j) => j.date)).toEqual(['2026-03-10']);
    // La vente supprimée : le jour d'abattage revient, avec ses deux animaux.
    const apres = joursAbattusAFacturer(animaux, []);
    expect(apres.map((j) => [j.date, j.animaux.length])).toEqual([
      ['2026-03-10', 1],
      ['2026-02-25', 2],
    ]);
  });
});

describe('document de circulation : vente déclarée et transport d’animaux vivants', () => {
  const vente = (extra: Record<string, unknown>) =>
    ({ categorie: 'viande', date: '2026-03-06', animaux: 'a;b', choixFacture: 'avec_facture', ...extra }) as never;

  it('est nécessaire pour des animaux envoyés vivants à l’abattoir ou vendus vivants, quand la vente est déclarée', () => {
    expect(documentCirculationRequis(vente({}))).toBe(true);
    expect(documentCirculationRequis(vente({ etatAnimaux: 'vivants' }))).toBe(true);
    expect(documentCirculationRequis(vente({ categorie: 'animal_vivant' }))).toBe(true);
  });

  it('n’est pas nécessaire pour des animaux morts, une vente sans facture, ou sans animal', () => {
    expect(documentCirculationRequis(vente({ etatAnimaux: 'morts' }))).toBe(false);
    expect(documentCirculationRequis(vente({ choixFacture: 'sans_facture' }))).toBe(false);
    expect(documentCirculationRequis(vente({ animaux: undefined }))).toBe(false);
  });

  it('les cabris remis vivants sortent « vendus », remis morts « morts »', () => {
    expect(sortieDesAnimauxDeLaVente(vente({ etatAnimaux: 'vivants' })).statut).toBe('vendue');
    expect(sortieDesAnimauxDeLaVente(vente({ etatAnimaux: 'morts' })).statut).toBe('morte');
    expect(sortieDesAnimauxDeLaVente(vente({})).statut).toBe('abattoir');
  });
});

describe('état des animaux d’une vente de viande', () => {
  it('abattoir : toujours vivants ; adultes : selon la ligne ; cabris : morts avec facture, au choix sans', () => {
    expect(reglageEtatAnimaux({ clientAbattoir: true, role: 'jeune', declaree: true })).toEqual({ choix: false, etat: undefined });
    expect(reglageEtatAnimaux({ clientAbattoir: false, role: 'vivant', declaree: true })).toEqual({ choix: false, etat: 'vivants' });
    expect(reglageEtatAnimaux({ clientAbattoir: false, role: 'pied', declaree: false })).toEqual({ choix: false, etat: 'morts' });
    expect(reglageEtatAnimaux({ clientAbattoir: false, role: 'jeune', declaree: true })).toEqual({ choix: false, etat: 'morts' });
    expect(reglageEtatAnimaux({ clientAbattoir: false, role: 'jeune', declaree: false })).toEqual({ choix: true });
  });
});
