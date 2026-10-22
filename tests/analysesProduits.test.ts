import { describe, expect, it } from 'vitest';
import {
  PARAMETRES,
  analysesDuProduit,
  evaluer,
  joursDepuis,
  nombreSaisi,
  verdictDeLAnalyse,
} from '@/features/analyses/services/analysesProduits';
import type { AnalyseProduit } from '@/features/settings/settings';

const parametre = (produit: 'fromage' | 'charcuterie', id: string) => PARAMETRES[produit].find((p) => p.id === id)!;
const analyse = (extra: Partial<AnalyseProduit>): AnalyseProduit => ({ id: 'a', produit: 'fromage', date: '2026-10-01', resultats: {}, ...extra });

describe('analyses du fromage et de la charcuterie', () => {
  it('juge une recherche dans 25 g : l’absence est conforme, la présence ne l’est pas', () => {
    const listeria = parametre('fromage', 'listeria');
    expect(evaluer(listeria, 'absence')).toBe('conforme');
    expect(evaluer(listeria, 'presence')).toBe('non_conforme');
    expect(evaluer(listeria, undefined)).toBeUndefined();
  });

  it('juge un dénombrement d’après ses deux seuils', () => {
    const staph = parametre('fromage', 'staphylocoques');
    expect(evaluer(staph, 5_000)).toBe('conforme');
    expect(evaluer(staph, 10_000)).toBe('conforme');
    expect(evaluer(staph, 50_000)).toBe('surveiller');
    expect(evaluer(staph, 100_001)).toBe('non_conforme');
  });

  it('ne juge pas un dénombrement sans seuil de repère (charcuterie)', () => {
    expect(evaluer(parametre('charcuterie', 'ecoli'), 1_000_000)).toBeUndefined();
  });

  it('le jugement d’une analyse est le pire de ses paramètres', () => {
    expect(verdictDeLAnalyse(analyse({ resultats: { listeria: 'absence', staphylocoques: 50_000 } }))).toBe('surveiller');
    expect(verdictDeLAnalyse(analyse({ resultats: { listeria: 'presence', staphylocoques: 50_000 } }))).toBe('non_conforme');
    expect(verdictDeLAnalyse(analyse({ resultats: {} }))).toBeUndefined();
  });

  it('range les analyses d’un produit de la plus récente à la plus ancienne', () => {
    const toutes = [
      analyse({ id: 'a', date: '2026-01-10' }),
      analyse({ id: 'b', date: '2026-06-10' }),
      analyse({ id: 'c', produit: 'charcuterie', date: '2026-09-10' }),
    ];
    expect(analysesDuProduit(toutes, 'fromage').map((a) => a.id)).toEqual(['b', 'a']);
    expect(analysesDuProduit(undefined, 'fromage')).toEqual([]);
  });

  it('compte les jours depuis une analyse et lit un nombre saisi avec la virgule', () => {
    expect(joursDepuis('2026-10-01', '2026-10-22')).toBe(21);
    expect(nombreSaisi('12,5')).toBe(12.5);
    expect(nombreSaisi('')).toBeUndefined();
    expect(nombreSaisi('abc')).toBeUndefined();
  });
});
