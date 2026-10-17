import { describe, expect, it } from 'vitest';
import { documentCirculationHtml, donneesDeCirculation, lieuDArrivee } from '@/features/export/documentCirculationPdf';
import type { Chevre } from '@/features/cheptel/types';
import type { Client } from '@/features/clients/types';
import type { Vente } from '@/features/comptabilite/types';

const animal = (numeroBoucle: string, sexe: 'F' | 'M' = 'F'): Chevre =>
  ({ id: numeroBoucle, numeroBoucle, sexe, statut: 'vivante', dateNaissance: '2020-01-01', espece: 'chevres' }) as unknown as Chevre;
const vente = (extra: Partial<Vente> = {}): Vente =>
  ({ id: 'v', date: '2026-03-10', categorie: 'animal_sur_pied', quantite: 2, unite: 'piece', prix: 100, client: 'Martin Paul', ...extra }) as Vente;
const infos = {
  nomExploitant: 'Riolacci Joseph',
  numeroExploitation: 'FR 20213003',
  siret: '922 982 657 00012',
  adresseExploitant: 'Pianellucciu, 7\n20272 Pianellu',
  indicatifMarquage: 'FR2021',
} as never;

describe('document de circulation', () => {
  it('le détenteur de départ, l’arrivée et les reproducteurs un par un', () => {
    const client = { id: 'c', nom: 'Martin', prenom: 'Paul', categorie: 'particulier', adressePostale: 'Route de Bastia\n20200 Bastia' } as Client;
    const d = donneesDeCirculation({
      vente: vente(),
      animaux: [animal('00462'), animal('00463', 'M')],
      client,
      infos,
      petit: () => false,
    });
    expect(d.depart).toMatchObject({ numeroExploitation: 'FR20213003', siren: '922982657', nom: 'Riolacci Joseph', adresse: 'Pianellucciu, 7', codePostal: '20272', commune: 'Pianellu' });
    expect(d.arrivee).toMatchObject({ lieu: 'particulier', nom: 'Martin Paul', adresse: 'Route de Bastia', codePostal: '20200', commune: 'Bastia' });
    expect(d.reproducteurs).toBe(2);
    expect(d.individuels).toEqual(['FR202100462', 'FR202100463']);
    expect(d.boucherie).toEqual([]);
    expect(d.date).toBe('2026-03-10');
  });

  it('les petits de boucherie sont comptés par indicatif de marquage', () => {
    const d = donneesDeCirculation({ vente: vente(), animaux: [animal('1'), animal('2'), animal('3')], infos, petit: (a) => a.numeroBoucle !== '3' });
    expect(d.boucherie).toEqual([{ indicatif: 'FR2021', nombre: 2 }]);
    expect(d.individuels).toEqual(['FR20213']);
  });

  it('le lieu d’arrivée : l’abattoir pour de la viande déclarée, sinon d’après la catégorie du client', () => {
    expect(lieuDArrivee({ categorie: 'viande', choixFacture: 'avec_facture' } as never)).toBe('abattoir');
    expect(lieuDArrivee({ categorie: 'animal_vivant' } as never, { categorie: 'entreprise' })).toBe('operateur');
    expect(lieuDArrivee({ categorie: 'animal_vivant' } as never, { categorie: 'particulier' })).toBe('particulier');
    expect(lieuDArrivee({ categorie: 'animal_vivant' } as never, { categorie: 'organisme' })).toBe('elevage');
  });

  it('le document dit qu’il est pour exemple et rappelle les cinq feuillets', () => {
    const d = donneesDeCirculation({ vente: vente(), animaux: [animal('00462')], infos, petit: () => false });
    const html = documentCirculationHtml(d);
    expect(html).toContain('EXEMPLE');
    expect(html).toContain('FR20213003');
    expect(html).toContain('FR202100462');
    expect(html).toContain('Blanc : à garder');
    expect(html).toContain('pour la Chambre d’agriculture');
    expect(html).toContain('pour le transporteur');
  });
});
