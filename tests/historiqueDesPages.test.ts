import { beforeEach, describe, expect, it } from 'vitest';
import { estUneCreation, noterPage, pageAvantLaCreation, pageDAvant, reculer, repartirDeLAccueil, revenirA, viderHistorique } from '@/shared/navigation/historiqueDesPages';

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

  it('revenir à une page déjà vue (flèche, fil d’Ariane, fin d’un formulaire) y ramène l’historique, sans l’allonger', () => {
    repartirDeLAccueil('/');
    noterPage('/production/lieu?lieu=assurance');
    noterPage('/comptabilite/nouvelle');
    noterPage('/production/lieu?lieu=assurance');
    expect(pageDAvant()).toBe('/');
    expect(reculer()).toBe('/');
  });

  it('une création en plusieurs écrans : terminer l’écriture revient à la page d’où tout a commencé', () => {
    repartirDeLAccueil('/');
    noterPage('/production/lieu?lieu=assurance');
    noterPage('/comptabilite/nouvelle?type=recue');
    noterPage('/comptabilite/contacts/nouveau');
    noterPage('/comptabilite/nouvelle?type=recue&contact=42');
    expect(pageAvantLaCreation()).toBe('/production/lieu?lieu=assurance');
    revenirA('/production/lieu?lieu=assurance');
    expect(pageDAvant()).toBe('/');
  });

  it('terminer le contact (créé depuis l’écriture) revient à l’écriture : la page d’avant', () => {
    repartirDeLAccueil('/');
    noterPage('/production/lieu?lieu=assurance');
    noterPage('/comptabilite/nouvelle?type=recue');
    noterPage('/comptabilite/contacts/nouveau');
    expect(pageDAvant()).toBe('/comptabilite/nouvelle?type=recue');
  });

  it('les pages de création se reconnaissent à leur adresse', () => {
    expect(estUneCreation('/comptabilite/nouvelle?type=recue')).toBe(true);
    expect(estUneCreation('/comptabilite/contacts/nouveau')).toBe(true);
    expect(estUneCreation('/comptabilite/contacts/contrat?fournisseur=1')).toBe(true);
    expect(estUneCreation('/comptabilite/liste')).toBe(false);
    expect(estUneCreation('/production/lieu?lieu=assurance')).toBe(false);
  });

  it('un retour à l’accueil oublie ce qui a été vu avant', () => {
    noterPage('/a');
    noterPage('/b');
    repartirDeLAccueil('/');
    expect(pageDAvant()).toBeUndefined();
  });
});
