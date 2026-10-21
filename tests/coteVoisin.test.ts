import { describe, expect, it } from 'vitest';
import { coteVoisin, estUnCote } from '@/features/accueil/ferme/dernierCote';

describe('les trois côtés de la ferme', () => {
  it('le balayage passe d’un côté au suivant, et s’arrête aux deux bouts', () => {
    expect(coteVoisin('exploitation', 1)).toBe('transformation');
    expect(coteVoisin('transformation', 1)).toBe('agritourisme');
    expect(coteVoisin('agritourisme', 1)).toBe('agritourisme');
    expect(coteVoisin('agritourisme', -1)).toBe('transformation');
    expect(coteVoisin('exploitation', -1)).toBe('exploitation');
  });

  it('reconnaît le nom d’un côté', () => {
    expect(estUnCote('agritourisme')).toBe(true);
    expect(estUnCote('gite')).toBe(false);
    expect(estUnCote(undefined)).toBe(false);
  });
});
