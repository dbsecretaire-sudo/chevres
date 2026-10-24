import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { remplirBordereauxPerte } from '@/features/export/documents/bordereauPertePdf';
import { remplirSuiviMouvements } from '@/features/export/documents/suiviMouvementsPdf';
import type { LigneMouvement, SuiviAnnuel } from '@/features/cheptel/services/suiviMouvements';
import { remplirModele } from '@/features/export/services/modelePdf';
import { MODELE_BORDEREAUX_2026 } from '@/features/export/modeles/bordereaux2026';
import { MODELE_ESTIVE_2026 } from '@/features/export/modeles/estive2026';
import { MODELE_SUIVI_2026 } from '@/features/export/modeles/suivi2026';

const identite = { numeroPacage: '02B153928', siret: '12345678900011', numeroExploitation: 'FR20213003', nom: 'Riolacci Joseph' };

describe('formulaires officiels embarqués', () => {
  it('les modèles sont des PDF d’une page, de la taille prévue', async () => {
    const bordereaux = await PDFDocument.load(MODELE_BORDEREAUX_2026);
    expect(bordereaux.getPageCount()).toBe(1);
    expect(Math.round(bordereaux.getPage(0).getSize().width)).toBe(595);
    const estive = await PDFDocument.load(MODELE_ESTIVE_2026);
    expect(estive.getPageCount()).toBe(1);
    expect(Math.round(estive.getPage(0).getSize().width)).toBe(1191);
  });

  it('un modèle sans élément donne quand même une page blanche du modèle', async () => {
    const pdf = await PDFDocument.load(await remplirModele(MODELE_BORDEREAUX_2026, [], () => undefined));
    expect(pdf.getPageCount()).toBe(1);
  });
});

describe('bordereaux de perte sur la feuille officielle', () => {
  it('deux bordereaux par feuille A4 : trois pertes font deux pages', async () => {
    const pertes = [
      { date: '2026-06-12', nombre: 3 },
      { date: '2026-09-01', nombre: 12 },
      { date: '2026-10-02', nombre: 1 },
    ];
    const pdf = await PDFDocument.load(await remplirBordereauxPerte(pertes, identite, 'chevres'));
    expect(pdf.getPageCount()).toBe(2);
    const { width, height } = pdf.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
  });

  it('une seule perte fait une seule page', async () => {
    const pdf = await PDFDocument.load(await remplirBordereauxPerte([{ date: '2026-06-12', nombre: 3 }], identite, 'brebis'));
    expect(pdf.getPageCount()).toBe(1);
  });

  it('écrit sans erreur les caractères que la police standard ne connaît pas', async () => {
    const pdf = await PDFDocument.load(
      await remplirBordereauxPerte([{ date: '2026-06-12', nombre: 3 }], { ...identite, nom: 'Ibéri – Ŝtalo ✓' }, 'chevres'),
    );
    expect(pdf.getPageCount()).toBe(1);
  });
});

describe('suivi des mouvements sur la feuille officielle', () => {
  const e = (jeunes: number, femelles: number, males: number) => ({ jeunes, femelles, males });
  const ligne = (i: number): LigneMouvement => ({
    date: '2026-03-' + String(10 + (i % 15)),
    cause: i % 2 === 0 ? 'N' : 'V',
    entrees: i % 2 === 0 ? e(4, 0, 0) : e(0, 0, 0),
    sorties: i % 2 === 1 ? e(0, 1, 0) : e(0, 0, 0),
    nom: i % 2 === 1 ? 'Boucherie Orsini' : undefined,
  });
  const suivi = (nombre: number): SuiviAnnuel => ({
    annee: 2026,
    effectifDebut: e(0, 100, 5),
    lignes: Array.from({ length: nombre }, (_, i) => ligne(i)),
    effectifFin: e(0, 100, 5),
  });

  it('le modèle est une page A4 en portrait', async () => {
    const pdf = await PDFDocument.load(MODELE_SUIVI_2026);
    expect(pdf.getPageCount()).toBe(1);
    expect(Math.round(pdf.getPage(0).getSize().width)).toBe(595);
    expect(Math.round(pdf.getPage(0).getSize().height)).toBe(842);
  });

  it('une feuille par douze mouvements', async () => {
    const pdf = await PDFDocument.load(await remplirSuiviMouvements([suivi(14)], identite, 'chevres', '2026-10-16'));
    expect(pdf.getPageCount()).toBe(2);
    const pdfVide = await PDFDocument.load(await remplirSuiviMouvements([suivi(0)], identite, 'chevres', '2026-10-16'));
    expect(pdfVide.getPageCount()).toBe(1);
  });

  it('remplit la colonne des brebis aussi, avec des noms longs et des accents', async () => {
    const s = suivi(3);
    s.lignes[1] = { ...s.lignes[1], nom: 'Société coopérative agricole « Les Crêtes d’Ibéri » de la plaine orientale' };
    const pdf = await PDFDocument.load(await remplirSuiviMouvements([s], identite, 'brebis', '2026-10-16'));
    expect(pdf.getPageCount()).toBe(1);
  });
});
