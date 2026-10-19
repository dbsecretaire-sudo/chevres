import { describe, expect, it } from 'vitest';
import { portraitDeTiers } from '@/features/contacts/services/portraitTiers';

describe('portrait d’un tiers', () => {
  it('chaque catégorie connue a son dessin', () => {
    expect(portraitDeTiers('abattoir').emoji).toBe('🏭');
    expect(portraitDeTiers('carburant').emoji).toBe('⛽');
    expect(portraitDeTiers('recolteur').emoji).toBe('🚚');
    expect(portraitDeTiers('veterinaire').emoji).toBe('🩺');
  });

  it('une catégorie inconnue ou absente a un portrait neutre', () => {
    expect(portraitDeTiers('ma-categorie').emoji).toBe('👤');
    expect(portraitDeTiers(undefined).emoji).toBe('👤');
  });
});
