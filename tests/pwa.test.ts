import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const racine = join(__dirname, '..');
const manifeste = JSON.parse(readFileSync(join(racine, 'public', 'manifest.webmanifest'), 'utf8'));

describe('la version web installable (PWA)', () => {
  it('le manifeste s’ouvre en plein écran, sur l’accueil', () => {
    expect(manifeste.display).toBe('standalone');
    expect(manifeste.start_url).toBe('/');
    expect(manifeste.lang).toBe('fr');
  });

  it('chaque icône du manifeste existe dans le dossier public', () => {
    for (const icone of manifeste.icons) {
      expect(existsSync(join(racine, 'public', icone.src))).toBe(true);
    }
  });

  it('l’icône de l’écran d’accueil d’un iPhone existe', () => {
    expect(existsSync(join(racine, 'public', 'apple-touch-icon.png'))).toBe(true);
  });
});
