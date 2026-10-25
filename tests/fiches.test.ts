import { describe, expect, it } from 'vitest';
import { appliquerModification, fichesDe, FICHE_ENTIERE, fusionnerModifications, modificationsDe } from '@/shared/storage/fiches';

describe('le découpage des valeurs en fiches', () => {
  it('une liste d’éléments avec un id donne une fiche par élément', () => {
    const fiches = fichesDe([{ id: 'a', n: 1 }, { id: 'b', n: 2 }]);
    expect([...fiches.keys()]).toEqual(['a', 'b']);
  });

  it('une autre valeur forme une seule fiche entière', () => {
    expect([...fichesDe({ actif: true }).keys()]).toEqual([FICHE_ENTIERE]);
    expect([...fichesDe('texte').keys()]).toEqual([FICHE_ENTIERE]);
  });

  it('une liste dont un élément n’a pas d’id reste une fiche entière', () => {
    expect([...fichesDe([{ id: 'a' }, { nom: 'sans id' }]).keys()]).toEqual([FICHE_ENTIERE]);
  });

  it('une valeur absente n’a aucune fiche', () => {
    expect(fichesDe(undefined).size).toBe(0);
  });
});

describe('ce qui a changé entre deux valeurs', () => {
  const zone = 'troupeau:v1:animaux:2026';

  it('un ajout, une modification et une suppression sont chacun une modification', () => {
    const avant = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }];
    const apres = [{ id: 'a', n: 9 }, { id: 'c', n: 3 }];
    expect(modificationsDe(zone, avant, apres)).toEqual([
      { zone, identifiant: 'a', contenu: { id: 'a', n: 9 } },
      { zone, identifiant: 'c', contenu: { id: 'c', n: 3 } },
      { zone, identifiant: 'b', contenu: null },
    ]);
  });

  it('une fiche inchangée n’est pas renvoyée', () => {
    const liste = [{ id: 'a', n: 1 }];
    expect(modificationsDe(zone, liste, [{ id: 'a', n: 1 }])).toEqual([]);
  });

  it('la première écriture d’une zone envoie toutes ses fiches', () => {
    expect(modificationsDe(zone, undefined, [{ id: 'a' }])).toEqual([{ zone, identifiant: 'a', contenu: { id: 'a' } }]);
  });
});

describe('la file d’attente', () => {
  it('une seule modification par fiche : la plus récente l’emporte', () => {
    const file = [
      { zone: 'z', identifiant: 'a', contenu: 1 },
      { zone: 'z', identifiant: 'b', contenu: 2 },
      { zone: 'z', identifiant: 'a', contenu: 3 },
    ];
    expect(fusionnerModifications(file)).toEqual([
      { zone: 'z', identifiant: 'a', contenu: 3 },
      { zone: 'z', identifiant: 'b', contenu: 2 },
    ]);
  });

  it('la même fiche dans deux zones reste deux fiches', () => {
    const file = [
      { zone: 'z1', identifiant: 'a', contenu: 1 },
      { zone: 'z2', identifiant: 'a', contenu: 2 },
    ];
    expect(fusionnerModifications(file)).toHaveLength(2);
  });
});

describe('l’application d’une modification reçue', () => {
  const zone = 'z';

  it('ajoute une fiche absente de la liste locale', () => {
    expect(appliquerModification([{ id: 'a' }], { zone, identifiant: 'b', contenu: { id: 'b' } })).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('remplace une fiche existante', () => {
    expect(appliquerModification([{ id: 'a', n: 1 }], { zone, identifiant: 'a', contenu: { id: 'a', n: 2 } })).toEqual([{ id: 'a', n: 2 }]);
  });

  it('retire une fiche supprimée', () => {
    expect(appliquerModification([{ id: 'a' }, { id: 'b' }], { zone, identifiant: 'a', contenu: null })).toEqual([{ id: 'b' }]);
  });

  it('une fiche entière remplace la valeur, et sa suppression la vide', () => {
    expect(appliquerModification({ x: 1 }, { zone, identifiant: FICHE_ENTIERE, contenu: { x: 2 } })).toEqual({ x: 2 });
    expect(appliquerModification({ x: 1 }, { zone, identifiant: FICHE_ENTIERE, contenu: null })).toBeUndefined();
  });

  it('une fiche reçue ne change pas la liste locale d’origine', () => {
    const locale = [{ id: 'a' }];
    appliquerModification(locale, { zone, identifiant: 'b', contenu: { id: 'b' } });
    expect(locale).toEqual([{ id: 'a' }]);
  });
});
