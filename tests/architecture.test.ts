import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Les règles de rangement du code (voir docs/ARCHITECTURE.md) : ce test échoue quand un fichier importe dans le mauvais sens.
 *   shared  <  features  <  app        (une couche n'importe que celles du dessous)
 */
const SRC = join(__dirname, '..', 'src');

function fichiers(dossier: string, sortie: string[] = []): string[] {
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) fichiers(chemin, sortie);
    else if (/\.(ts|tsx)$/.test(e.name)) sortie.push(chemin);
  }
  return sortie;
}

interface Import {
  fichier: string;
  cible: string;
  /** `import type` : effacé à la compilation, il ne crée aucune dépendance à l'exécution. */
  type: boolean;
}

function importsDe(dossier: string): Import[] {
  const resultat: Import[] = [];
  for (const chemin of fichiers(join(SRC, dossier))) {
    const texte = readFileSync(chemin, 'utf8');
    for (const m of texte.matchAll(/(?:^|\n)\s*(import|export)\s+(type\s+)?[^;]*?from\s+'@\/([^']+)'/g)) {
      resultat.push({ fichier: relative(SRC, chemin).split(sep).join('/'), cible: m[3], type: !!m[2] });
    }
  }
  return resultat;
}

describe('architecture du code', () => {
  it('shared (la base) n’importe aucune fonctionnalité, sauf les types du catalogue de stockage', () => {
    const fautifs = importsDe('shared').filter(
      (i) => i.cible.startsWith('features/') && !(i.type && i.fichier.startsWith('shared/storage/')),
    );
    expect(fautifs.map((i) => `${i.fichier} → ${i.cible}`)).toEqual([]);
  });

  it('shared n’importe pas les écrans de routes (app)', () => {
    const fautifs = importsDe('shared').filter((i) => i.cible.startsWith('app/'));
    expect(fautifs.map((i) => `${i.fichier} → ${i.cible}`)).toEqual([]);
  });

  it('une fonctionnalité n’importe pas les routes (app) : ce sont elles qui l’utilisent', () => {
    const fautifs = importsDe('features').filter((i) => i.cible.startsWith('app/'));
    expect(fautifs.map((i) => `${i.fichier} → ${i.cible}`)).toEqual([]);
  });
});
