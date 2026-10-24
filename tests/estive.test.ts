import { describe, expect, it } from 'vitest';
import { codePostalEtCommune, effectifALaMontee } from '@/features/cheptel/services/estive';
import type { Chevre } from '@/features/cheptel/types';
import { PDFDocument } from 'pdf-lib';
import {
  declarationEstiveHtml,
  entiteCollective,
  estLeGestionnaire,
  remplirDeclarationEstive,
  separerNomPrenom,
  type DonneesEstive,
} from '@/features/export/documents/declarationEstivePdf';

const animal = (id: string, plus: Partial<Chevre>): Chevre =>
  ({ id, sexe: 'F', statut: 'vivante', dateNaissance: '2020-01-01', numeroBoucle: `1000${id}`, ...plus }) as unknown as Chevre;
const libelles = { abattoir: 'Abattoir', autoConsommation: 'Auto-consommation' };

describe('effectif de caprins à la montée', () => {
  it('compte les adultes (femelles et mâles) présents ce jour-là, pas les jeunes', () => {
    const animaux = [
      animal('1', {}),
      animal('2', {}),
      animal('3', { sexe: 'M' }),
      // Un jeune de l'année : il ne compte pas.
      animal('4', { dateNaissance: '2026-03-01' }),
    ];
    expect(effectifALaMontee(animaux, [], '2026-06-01', libelles)).toBe(3);
  });

  it('retire ceux qui sont sortis avant la montée et garde ceux qui sortent après', () => {
    const animaux = [
      animal('1', {}),
      animal('2', { statut: 'morte', dateStatut: '2026-05-10' }),
      animal('3', { statut: 'morte', dateStatut: '2026-07-10' }),
    ];
    expect(effectifALaMontee(animaux, [], '2026-06-01', libelles)).toBe(2);
    expect(effectifALaMontee(animaux, [], '2026-08-01', libelles)).toBe(1);
  });

  it('une femelle qui a déjà mis bas compte avant son premier anniversaire', () => {
    const animaux = [
      animal('1', { dateNaissance: '2025-09-01' }),
      animal('2', { dateNaissance: '2026-03-01', mereId: '1' }),
    ];
    // La mère a un an en septembre 2026 mais elle a mis bas le 1er mars : elle compte dès cette date.
    expect(effectifALaMontee(animaux, [], '2026-06-01', libelles)).toBe(1);
  });
});

describe('adresse de l’exploitation', () => {
  it('prend le code postal et la commune de la dernière ligne qui en a', () => {
    expect(codePostalEtCommune('Lieu-dit Pianella\n20250 Corte')).toEqual({ codePostal: '20250', commune: 'Corte' });
    expect(codePostalEtCommune('Pianella, 20250 Corte')).toEqual({ codePostal: '20250', commune: 'Corte' });
  });
  it('rend du vide quand l’adresse n’en donne pas', () => {
    expect(codePostalEtCommune('Lieu-dit Pianella')).toEqual({ codePostal: '', commune: '' });
    expect(codePostalEtCommune(undefined)).toEqual({ codePostal: '', commune: '' });
  });
});

describe('déclaration de montée et descente d’estive', () => {
  const donnees: DonneesEstive = {
    annee: 2026,
    identite: { numeroPacage: '020123456', siret: '12345678900011', numeroExploitation: 'FR20123456', nom: 'Anne Martin' },
    codePostal: '20250',
    commune: 'Corte',
    effectifCaprins: 87,
    dateMontee: '2026-06-15',
    dateDescente: '2026-10-20',
    zone: 'haute montagne',
    gestionnaire: 'GAEC des Crêtes',
    communeGestionnaire: 'Vivario',
  };
  const html = declarationEstiveHtml(donnees);

  it('remplit la ligne de l’exploitation et le cadre du gestionnaire', () => {
    for (const texte of ['>Anne<', '>Martin<', 'Corte', 'haute montagne', 'GAEC des Crêtes', 'Vivario', '>87<']) {
      expect(html).toContain(texte);
    }
    expect(html).toContain('campagne 2026');
    expect(html).toContain('16 novembre 2026');
  });

  it('a vingt-trois lignes de seize cases chacune, comme les en-têtes', () => {
    const corps = html.split('<tbody>')[1].split('</tbody>')[0];
    const lignes = corps.split('<tr').slice(1);
    expect(lignes).toHaveLength(23);
    for (const ligne of lignes) expect(ligne.split('<td').length - 1).toBe(16);
  });

  it('écrit les dates de montée et de descente en jour et mois', () => {
    expect(html).toContain('<i>1</i><i>5</i>');
    expect(html).toContain('<i>0</i><i>6</i>');
    expect(html).toContain('<i>2</i><i>0</i>');
    expect(html).toContain('<i>1</i><i>0</i>');
  });

  it('sans date de montée, la case des caprins reste vide ; une autre campagne renvoie à la DDT(M)', () => {
    const autre = declarationEstiveHtml({ ...donnees, annee: 2027, effectifCaprins: undefined });
    expect(autre).not.toContain('>87<');
    expect(autre).not.toContain('16 novembre');
    expect(autre).toContain('date limite');
  });
});

describe('formulaire officiel de la campagne 2026', () => {
  const donnees: DonneesEstive = {
    annee: 2026,
    identite: { numeroPacage: '02B153928', siret: '12345678900011', numeroExploitation: 'FR20213003', nom: 'Riolacci Joseph' },
    codePostal: '20272',
    commune: 'Pianello',
    effectifCaprins: 87,
    dateMontee: '2026-06-15',
    zone: 'haute montagne, Ibéri',
    gestionnaire: 'Riolacci Joseph',
  };

  it('le nom complet « Nom Prénom » se sépare, un mot seul reste le nom', () => {
    expect(separerNomPrenom('Riolacci Joseph')).toEqual({ nom: 'Riolacci', prenom: 'Joseph' });
    expect(separerNomPrenom('Orsini Jean Pierre')).toEqual({ nom: 'Orsini', prenom: 'Jean Pierre' });
    expect(separerNomPrenom('GAEC')).toEqual({ nom: 'GAEC', prenom: '' });
  });

  it('le gestionnaire est l’exploitant quand le nom est le même (dans un sens ou l’autre) ou quand c’est coché', () => {
    expect(estLeGestionnaire(donnees)).toBe(true);
    expect(estLeGestionnaire({ ...donnees, gestionnaire: 'Joseph Riolacci' })).toBe(true);
    expect(estLeGestionnaire({ ...donnees, gestionnaire: 'Autre Personne' })).toBe(false);
    expect(estLeGestionnaire({ ...donnees, gestionnaire: 'Autre Personne', moiGestionnaire: true })).toBe(true);
    expect(estLeGestionnaire({ ...donnees, moiGestionnaire: false })).toBe(false);
  });

  it('le cadre de l’entité reprend les numéros de l’exploitant quand il est le gestionnaire', () => {
    expect(entiteCollective(donnees)).toEqual({
      numeroPacage: '02B153928',
      siret: '12345678900011',
      commune: 'Pianello',
      gestionnaire: 'Riolacci Joseph',
    });
    const autre = entiteCollective({ ...donnees, gestionnaire: 'GAEC des Crêtes', communeGestionnaire: 'Vivario' });
    expect(autre).toEqual({ numeroPacage: '', siret: '', commune: 'Vivario', gestionnaire: 'GAEC des Crêtes' });
  });

  it('remplit le formulaire officiel : une seule page, de la taille du modèle (A3 paysage)', async () => {
    const base64 = await remplirDeclarationEstive(donnees);
    const pdf = await PDFDocument.load(base64);
    expect(pdf.getPageCount()).toBe(1);
    const { width, height } = pdf.getPage(0).getSize();
    expect(Math.round(width)).toBe(1191);
    expect(Math.round(height)).toBe(842);
  });
});
