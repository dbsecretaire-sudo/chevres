import { beforeEach, describe, expect, it } from 'vitest';
import { noterPage, pageDAvant, reculer, repartirDeLAccueil, viderHistorique } from '@/shared/navigation/historiqueDesPages';

describe('historique des pages pour la flèche de retour', () => {
  beforeEach(() => viderHistorique());

  it('le retour ramène à la page d’où l’on vient, pas à une page « parente »', () => {
    repartirDeLAccueil('/');
    noterPage('/comptabilite/liste');
    expect(reculer()).toBe('/');
  });

  it('plusieurs pages : on revient une à une, dans l’ordre inverse', () => {
    repartirDeLAccueil('/');
    noterPage('/production/lieu?lieu=animaux');
    noterPage('/cheptel/fiche?id=1');
    expect(reculer()).toBe('/production/lieu?lieu=animaux');
    expect(reculer()).toBe('/');
    expect(reculer()).toBeUndefined();
  });

  it('une page notée deux fois de suite ne compte qu’une fois', () => {
    repartirDeLAccueil('/');
    noterPage('/a');
    noterPage('/a');
    expect(pageDAvant()).toBe('/');
  });

  it('après un retour, la page rendue (notée de nouveau par l’écran) ne s’ajoute pas', () => {
    repartirDeLAccueil('/');
    noterPage('/a');
    noterPage('/b');
    const retour = reculer();
    noterPage(retour as string);
    expect(pageDAvant()).toBe('/');
  });

  it('un retour à l’accueil oublie ce qui a été vu avant', () => {
    noterPage('/a');
    noterPage('/b');
    repartirDeLAccueil('/');
    expect(pageDAvant()).toBeUndefined();
  });
});
