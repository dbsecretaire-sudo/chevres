import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { donneesDeCirculation, feuilletsCirculation, lieuDArrivee, mortsTransportDuJour, zonesACompleter, petitOuTiptag, remplirDocumentCirculation } from '@/features/export/documentCirculationPdf';
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

  it('les informations sanitaires : aucun risque, ou des animaux sous délai d’attente pour la viande', () => {
    const traitement = { id: 't', date: '2026-03-01', produit: 'Ivermectine', delaiViandeJours: 20, chevreNumeroBoucle: '00462' } as never;
    const sans = donneesDeCirculation({ vente: vente(), animaux: [animal('00462')], infos, petit: () => false });
    expect(sans.sanitaire).toEqual({ risque: false, animaux: [] });
    const avec = donneesDeCirculation({ vente: vente(), animaux: [animal('00462'), animal('00463')], infos, petit: () => false, traitements: [traitement] });
    expect(avec.sanitaire).toEqual({ risque: true, animaux: [{ boucle: '00462', produit: 'Ivermectine', fin: '2026-03-21' }] });
  });

  it('le PDF : le formulaire de la Chambre rempli (page 1) et le rappel des cinq feuillets (page 2)', async () => {
    const d = donneesDeCirculation({
      vente: vente(),
      animaux: Array.from({ length: 45 }, (_, i) => animal(String(500 + i))),
      infos,
      petit: () => false,
    });
    const pdf = await PDFDocument.load(await remplirDocumentCirculation(d));
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPage(0).getSize().width).toBeCloseTo(593, 0);
    expect(feuilletsCirculation('vente').map((f) => f.libelle)).toEqual([
      'Blanc : je garde',
      'Jaune : je garde',
      'Vert : je donne à l’acheteur',
      'Bleu : je donne à l’acheteur',
      'Rose : je garde d’abord, puis j’envoie à la Chambre d’agriculture',
    ]);
    expect(feuilletsCirculation('achat').map((f) => f.libelle)).toEqual([
      'Bleu : je garde',
      'Blanc : je donne',
      'Jaune : je donne',
      'Rose : je donne',
      'Vert : je garde d’abord, puis j’envoie à la Chambre d’agriculture',
    ]);
  });
});

describe('zones à compléter à la main', () => {
  const base = () => donneesDeCirculation({ vente: vente(), animaux: [animal('00462')], infos, petit: () => false });
  const signatureDepart = (z: number[]) => z[0] === 165 && z[1] === 60;
  const signatureArrivee = (z: number[]) => z[0] === 428 && z[1] === 50;
  it('une vente : l’exploitation notifie le départ (en bas à gauche)', () => {
    const zones = zonesACompleter(base());
    expect(zones.some(signatureDepart)).toBe(true);
    expect(zones.some(signatureArrivee)).toBe(false);
  });
  it('un achat : l’exploitation notifie l’arrivée (en bas à droite)', () => {
    const zones = zonesACompleter({ ...base(), notifie: 'arrivee' });
    expect(zones.some(signatureArrivee)).toBe(true);
    expect(zones.some(signatureDepart)).toBe(false);
  });
  it('une adresse inconnue de l’arrivée est à compléter aussi', () => {
    const d = base();
    const sans = zonesACompleter({ ...d, arrivee: { ...d.arrivee, nom: 'Client', adresse: 'Rue', codePostal: '20000', commune: 'Ajaccio' } }).length;
    expect(zonesACompleter({ ...d, arrivee: { ...d.arrivee, nom: '', adresse: '', codePostal: '', commune: '' } }).length).toBe(sans + 4);
  });
});

describe('indicatif de marquage du formulaire', () => {
  it('s’écrit sans « FR » ni espaces, pour tenir un chiffre par case', async () => {
    const { chiffresDeLIndicatif } = await import('@/features/export/documentCirculationPdf');
    expect(chiffresDeLIndicatif('FR 212282')).toBe('212282');
    expect(chiffresDeLIndicatif('FR212282')).toBe('212282');
    expect(chiffresDeLIndicatif(' fr 21 22 82 ')).toBe('212282');
    expect(chiffresDeLIndicatif('212282')).toBe('212282');
  });
});

describe('les tiptag vont avec les chevreaux de boucherie', () => {
  it('un tiptag, même d’un animal plus âgé, est compté en boucherie et non en reproducteur', () => {
    const tiptags = new Set(['3']);
    const d = donneesDeCirculation({ vente: vente(), animaux: [animal('1'), animal('2'), animal('3')], infos, petit: petitOuTiptag('2026-03-10', tiptags) });
    expect(d.boucherie).toEqual([{ indicatif: 'FR2021', nombre: 1 }]);
    expect(d.reproducteurs).toBe(2);
    expect(d.individuels).toHaveLength(2);
  });

  it('sans tiptag, un animal adulte reste un reproducteur', () => {
    expect(petitOuTiptag('2026-03-10', new Set())(animal('1'))).toBe(false);
  });
});

describe('animaux morts pendant le transport', () => {
  it('le nombre est repris dans les données et le document se remplit', async () => {
    const d = donneesDeCirculation({ vente: vente(), animaux: [animal('1'), animal('2')], infos, petit: () => true, mortsTransport: 2 });
    expect(d.mortsTransport).toBe(2);
    expect(donneesDeCirculation({ vente: vente(), animaux: [animal('1')], infos, petit: () => true }).mortsTransport).toBe(0);
    const pdf = await PDFDocument.load(await remplirDocumentCirculation(d));
    expect(pdf.getPageCount()).toBe(2);
  });
});

describe('morts pendant le transport lus dans le lot', () => {
  it('compte les bêtes du jour déclarées mortes pendant le transport, pas les saisies sanitaires', () => {
    const lots = [{ id: 'l', nom: 'L', boucles: '', abattoir: '2025-02-12', inconsommables: [{ id: 'a', motif: 'transport' }, { id: 'b', motif: 'sanitaire' }, { id: 'c', motif: 'transport' }] }] as never;
    expect(mortsTransportDuJour(lots, '2025-02-12', ['a', 'b'])).toBe(1);
    expect(mortsTransportDuJour(lots, '2025-02-12', ['a', 'c'])).toBe(2);
    expect(mortsTransportDuJour(lots, '2025-08-04', ['a'])).toBe(0);
    expect(mortsTransportDuJour(undefined, '2025-02-12', ['a'])).toBe(0);
  });
});
