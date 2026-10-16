import { describe, expect, it } from 'vitest';
import { carnetMiseBasHtml, ligneDuCarnet, porteesParAnnee } from '@/features/export/carnetMiseBasPdf';
import type { PorteeNaissance } from '@/features/cheptel/repository/naissances';
import type { Chevre } from '@/features/cheptel/types';

const petit = (sexe: 'F' | 'M', extra: Partial<Chevre> = {}): Chevre =>
  ({ id: Math.random().toString(), sexe, statut: 'vivante', dateNaissance: '2026-03-05', ...extra }) as unknown as Chevre;
const portee = (date: string, mere: string, cabrits: Chevre[]): PorteeNaissance => ({ date, mereNumeroBoucle: mere, cabrits });

describe('carnet de mise bas', () => {
  it('une ligne par mise bas : petits, sexes, boucles, mort-nés', () => {
    const ligne = ligneDuCarnet(
      portee('2026-03-05', '10042', [
        petit('F', { numeroBoucle: '20001' }),
        petit('M'),
        petit('F', { statut: 'mortne' }),
      ]),
    );
    expect(Object.values(ligne)).toEqual(['05/03/2026', '10042', 3, 2, 2, 1, '20001, sans boucle, sans boucle', '1 mort-né']);
  });

  it('une mère inconnue est dite inconnue, sans observation quand tout est vivant', () => {
    const ligne = ligneDuCarnet(portee('2026-03-05', '', [petit('F')]));
    expect(Object.values(ligne)[1]).toBe('inconnue');
    expect(Object.values(ligne)[7]).toBe('');
  });

  it('range les mises bas par année, la plus récente d’abord, chaque année dans l’ordre des dates', () => {
    const annees = porteesParAnnee([
      portee('2025-04-02', 'a', [petit('F')]),
      portee('2026-05-01', 'b', [petit('M')]),
      portee('2026-02-10', 'c', [petit('F')]),
    ]);
    expect(annees.map((a) => a.annee)).toEqual(['2026', '2025']);
    expect(annees[0].portees.map((p) => p.mereNumeroBoucle)).toEqual(['c', 'b']);
  });

  it('le document a une section par année avec le total des petits, ou un message sans naissance', () => {
    const html = carnetMiseBasHtml([portee('2026-05-01', 'b', [petit('M'), petit('F')])]);
    expect(html).toContain('2026');
    expect(html).toContain('2 petits');
    expect(carnetMiseBasHtml([])).toContain('Aucune');
  });
});
