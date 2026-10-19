import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

type Resolveur = (contexte: unknown, nom: string, plateforme: string) => { type: string; filePath: string };

describe('configuration Metro', () => {
  it('sur le web et Windows, pdf-lib vient de sa version autonome (celle qui importe tslib planterait au chargement : fenêtre blanche)', () => {
    const config = require('../metro.config.js') as { resolver: { resolveRequest: Resolveur } };
    const resolution = config.resolver.resolveRequest({}, 'pdf-lib', 'web');
    expect(resolution.type).toBe('sourceFile');
    expect(resolution.filePath.replace(/\\/g, '/')).toMatch(/pdf-lib\/dist\/pdf-lib\.js$/);
  });

  it('sur le téléphone, le stockage garde les données en mémoire (sauf pour ce module lui-même, qui importe l’original)', () => {
    const config = require('../metro.config.js') as { resolver: { resolveRequest: Resolveur } };
    const nom = '@react-native-async-storage/async-storage';
    const original = () => ({ type: 'ORIGINAL', filePath: '' });
    const enMemoire = config.resolver.resolveRequest({ originModulePath: '/app/src/x.ts', resolveRequest: original }, nom, 'android');
    expect(enMemoire.filePath.replace(/\\/g, '/')).toMatch(/src\/shared\/stockage-en-memoire\/asyncStorageEnMemoire\.ts$/);
    // Le module lui-même importe le vrai stockage, pas lui-même.
    const duModule = { originModulePath: enMemoire.filePath, resolveRequest: original };
    expect(config.resolver.resolveRequest(duModule, nom, 'android').type).toBe('ORIGINAL');
    // Quelle que soit la forme du chemin que Metro donne (disque en minuscule, accents, autre séparateur, autre dossier de travail).
    for (const chemin of [
      'c:\\users\\delphine\\documents\\projet claude\\chevre\\src\\shared\\stockage-en-memoire\\asyncStorageEnMemoire.ts',
      '/home/expo/workingdir/build/src/shared/stockage-en-memoire/asyncStorageEnMemoire.ts',
    ]) {
      expect(config.resolver.resolveRequest({ originModulePath: chemin, resolveRequest: original }, nom, 'android').type).toBe('ORIGINAL');
    }
  });

  it('le stockage en mémoire est seul dans son dossier (Metro mémorise la résolution par dossier : un voisin qui importe le stockage lui ferait importer lui-même, écran blanc)', () => {
    const dossier = path.join(__dirname, '..', 'src', 'shared', 'stockage-en-memoire');
    expect(fs.readdirSync(dossier)).toEqual(['asyncStorageEnMemoire.ts']);
  });
});
