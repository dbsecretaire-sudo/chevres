import { describe, expect, it } from 'vitest';
import { FICHE_ANIMAL, etapeApresUnMenu, etapeDeLaPage, etapeSuivante, etapesDeLaVisite, pageDeLEtape } from '@/features/didacticiel/services/visiteGuidee';
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

describe('avancer dans la visite', () => {
  const etapes = etapesDeLaVisite();
  const position = (id: string) => etapes.findIndex((e) => e.id === id);

  it('« Passer » ouvre la page de l’étape suivante, et la visite n’en revient pas en arrière', () => {
    const accueilCheptel = position('accueil.cheptel');
    const suite = etapeSuivante(etapes, accueilCheptel, '/');
    expect(suite?.index).toBe(position('cheptel.menu'));
    expect(suite?.ouvrir).toBe('/cheptel');
    // Une fois sur la page, c'est bien l'étape choisie qui s'affiche.
    expect(etapeDeLaPage(etapes, suite!.index, '/cheptel')).toBe(suite!.index);
  });

  it('« Passer » ne demande pas d’ouvrir la page où l’on est déjà', () => {
    expect(etapeSuivante(etapes, position('accueil.bienvenue'), '/')?.ouvrir).toBeUndefined();
  });

  it('les étapes de la fiche d’un animal sont passées quand on n’en a pas ouvert une', () => {
    const suite = etapeSuivante(etapes, position('cheptel.fiche.ouvrir'), '/cheptel/liste');
    expect(suite?.index).toBe(position('cheptel.retour.menu'));
    expect(etapeSuivante(etapes, position('cheptel.fiche.ouvrir'), '/cheptel/abc')?.index).toBe(position('cheptel.fiche'));
  });

  it('la dernière étape n’a pas de suivante', () => {
    expect(etapeSuivante(etapes, etapes.length - 1, '/organisation-regles')).toBeNull();
  });

  it('en ouvrant une page, la visite reprend à l’étape de cette page, en avant avant tout', () => {
    expect(etapeDeLaPage(etapes, position('cheptel.fiche.ouvrir'), '/cheptel/abc')).toBe(position('cheptel.fiche'));
    // De retour à la liste depuis la fiche : l'étape qui invite à revenir au menu.
    expect(etapeDeLaPage(etapes, position('cheptel.retour'), '/cheptel/liste')).toBe(position('cheptel.retour.menu'));
  });
});

describe('choisir un menu de la barre du haut (Windows)', () => {
  const etapes = etapesDeLaVisite();
  const position = (id: string) => etapes.findIndex((e) => e.id === id);

  it('l’entrée choisie ouvre la page d’une étape suivante : la visite y passe', () => {
    expect(etapeApresUnMenu(etapes, position('accueil.cheptel'), '/cheptel/liste')).toBe(position('cheptel.liste'));
    expect(etapeApresUnMenu(etapes, position('cheptel.retour.menu'), '/cheptel/naissances')).toBe(position('cheptel.naissances.page'));
  });

  it('une entrée que la visite ne connaît pas, ou la page où l’on est déjà, valide quand même l’étape', () => {
    expect(etapeApresUnMenu(etapes, position('accueil.cheptel'), '/cheptel/traitements')).toBe(position('accueil.cheptel') + 1);
    expect(etapeApresUnMenu(etapes, position('cheptel.retour.menu'), '/cheptel/liste')).toBe(position('cheptel.retour.menu') + 1);
  });

  it('une étape qui ne demande pas de menu n’est pas touchée', () => {
    expect(etapeApresUnMenu(etapes, position('cheptel.liste'), '/cheptel/naissances')).toBeNull();
  });
});

describe('noms des listes dans les opérations', () => {
  it('le préfixe « Achat — » ou « Ventes — » est retiré (le sens est dans la case)', () => {
    expect(nomDeLaListe('Achat — Aliment')).toBe('Aliment');
    expect(nomDeLaListe('Ventes — Boucherie et charcuterie')).toBe('Boucherie et charcuterie');
    expect(nomDeLaListe('Laine, Peaux')).toBe('Laine, Peaux');
  });
});
