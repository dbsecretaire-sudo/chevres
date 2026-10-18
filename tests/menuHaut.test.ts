import { describe, expect, it } from 'vitest';
import { centreDuMenu } from '@/features/didacticiel/services/menuHaut';

describe('le menu du haut de la fenêtre', () => {
  const mesure = (texte: string) => texte.length * 6;
  const menus = ['Accueil', 'Cheptel', 'Production'];

  it('place le centre du nom après ceux qui le précèdent', () => {
    expect(centreDuMenu(menus, 'Accueil', mesure)).toBe(8 + 21);
    expect(centreDuMenu(menus, 'Cheptel', mesure)).toBe(8 + 42 + 12 + 21);
  });

  it('ne place pas un menu qui n’existe pas', () => {
    expect(centreDuMenu(menus, 'Contacts', mesure)).toBeNull();
  });
});
