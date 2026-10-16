import { createRequire } from 'node:module';
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
});
