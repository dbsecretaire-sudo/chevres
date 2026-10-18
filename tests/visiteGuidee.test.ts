import { describe, expect, it } from 'vitest';
import { FICHE_ANIMAL, etapesDeLaVisite, pageDeLEtape } from '@/features/didacticiel/services/visiteGuidee';
import { nomDeLaListe } from '@/features/contacts/services/operationsInventaire';

describe('visite guidée', () => {
  it('une étape s’affiche sur sa page (adresse exacte ou motif), et partout sans page', () => {
    expect(pageDeLEtape('/cheptel', '/cheptel')).toBe(true);
    expect(pageDeLEtape('/cheptel', '/cheptel/')).toBe(true);
    expect(pageDeLEtape('/cheptel', '/cheptel/liste')).toBe(false);
    expect(pageDeLEtape(undefined, '/n-importe-quoi')).toBe(true);
    expect(pageDeLEtape('/', '/')).toBe(true);
  });

  it('la fiche d’un animal se distingue des autres pages du cheptel', () => {
    expect(FICHE_ANIMAL.test('/cheptel/a1b2c3')).toBe(true);
    expect(FICHE_ANIMAL.test('/cheptel/liste')).toBe(false);
    expect(FICHE_ANIMAL.test('/cheptel/naissances')).toBe(false);
    expect(FICHE_ANIMAL.test('/cheptel/documents-circulation')).toBe(false);
    expect(FICHE_ANIMAL.test('/cheptel')).toBe(false);
  });

  it('les étapes ont un identifiant unique, un titre et un texte ; une étape à toucher a de quoi la désigner ou invite à le faire', () => {
    const etapes = etapesDeLaVisite();
    expect(new Set(etapes.map((e) => e.id)).size).toBe(etapes.length);
    for (const e of etapes) {
      expect(e.titre.trim()).not.toBe('');
      expect(e.texte.trim()).not.toBe('');
    }
    expect(etapes[0].route).toBe('/');
  });
});

describe('noms des listes dans les opérations', () => {
  it('le préfixe « Achat — » ou « Ventes — » est retiré (le sens est dans la case)', () => {
    expect(nomDeLaListe('Achat — Aliment')).toBe('Aliment');
    expect(nomDeLaListe('Ventes — Boucherie et charcuterie')).toBe('Boucherie et charcuterie');
    expect(nomDeLaListe('Laine, Peaux')).toBe('Laine, Peaux');
  });
});
