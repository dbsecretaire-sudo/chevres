import { describe, expect, it } from 'vitest';
import { estLaPageOuverte } from '@/shared/navigation/pageOuverte';

describe('la page ouverte dans le menu en arbre', () => {
  it('une route sans paramètre correspond à son adresse', () => {
    expect(estLaPageOuverte('/comptabilite/liste', '/comptabilite/liste', {})).toBe(true);
    expect(estLaPageOuverte('/comptabilite/liste', '/comptabilite/contacts', {})).toBe(false);
  });

  it('parmi les lieux d’une même page, seul celui des paramètres s’allume', () => {
    const parametres = { lieu: 'animaux' };
    expect(estLaPageOuverte('/production/lieu?lieu=animaux', '/production/lieu', parametres)).toBe(true);
    expect(estLaPageOuverte('/production/lieu?lieu=grange', '/production/lieu', parametres)).toBe(false);
    expect(estLaPageOuverte('/production/lieu?lieu=boucles', '/production/lieu', parametres)).toBe(false);
  });

  it('une route à plusieurs paramètres les demande tous', () => {
    expect(estLaPageOuverte('/a?x=1&y=2', '/a', { x: '1', y: '2', z: '3' })).toBe(true);
    expect(estLaPageOuverte('/a?x=1&y=2', '/a', { x: '1' })).toBe(false);
  });
});
