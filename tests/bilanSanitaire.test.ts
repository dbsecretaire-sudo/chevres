import { describe, expect, it } from 'vitest';
import { estBilanSanitaire, etatDuBilan } from '@/features/sante/services/bilanSanitaire';

const visite = (date: string, motif: string) => ({ date, motif });

describe('bilan sanitaire annuel', () => {
  it('reconnaît un bilan sanitaire à son motif', () => {
    expect(estBilanSanitaire({ motif: 'Bilan sanitaire annuel' })).toBe(true);
    expect(estBilanSanitaire({ motif: 'bilan   sanitaire d’élevage, prophylaxie' })).toBe(true);
    expect(estBilanSanitaire({ motif: 'Prise de sang (dépistage)' })).toBe(false);
  });

  it('aucun bilan : rien d’enregistré', () => {
    expect(etatDuBilan([], '2026-10-16')).toEqual({ etat: 'aucun' });
    expect(etatDuBilan([visite('2026-05-01', 'Prophylaxie')], '2026-10-16').etat).toBe('aucun');
  });

  it('valide pendant un an, bientôt expiré dans les 60 derniers jours, puis expiré', () => {
    const v = [visite('2026-03-01', 'Bilan sanitaire annuel')];
    expect(etatDuBilan(v, '2026-10-16')).toMatchObject({ etat: 'valide', dernier: '2026-03-01', echeance: '2027-03-01' });
    expect(etatDuBilan(v, '2027-01-15')).toMatchObject({ etat: 'bientot', jours: 45 });
    expect(etatDuBilan(v, '2027-03-01')).toMatchObject({ etat: 'bientot', jours: 0 });
    expect(etatDuBilan(v, '2027-03-02')).toMatchObject({ etat: 'expire', jours: -1 });
  });

  it('c’est le dernier bilan qui compte, et un bilan futur n’en est pas un', () => {
    const v = [
      visite('2024-02-01', 'Bilan sanitaire annuel'),
      visite('2026-02-10', 'Bilan sanitaire annuel'),
      visite('2027-01-01', 'Bilan sanitaire annuel'),
    ];
    expect(etatDuBilan(v, '2026-10-16')).toMatchObject({ etat: 'valide', dernier: '2026-02-10' });
  });

  it('un bilan du 29 février passe au 1er mars l’année suivante, sans erreur', () => {
    expect(etatDuBilan([visite('2024-02-29', 'Bilan sanitaire')], '2024-06-01').echeance).toBe('2025-03-01');
  });
});
