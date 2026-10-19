import { describe, expect, it } from 'vitest';
import { etapesDuParcours, parcoursDeCas, parcoursDe } from '@/features/didacticiel/services/parcours';
import { etapePrecedente, etapeSuivante, etapeSurLaPage } from '@/features/didacticiel/services/visiteGuidee';
import { prixPersonnalisePropose } from '@/shared/dictionnaire/categoriesClient';

describe('parcours de cas du didacticiel', () => {
  const parcours = parcoursDeCas();

  it('les cas demandés y sont, chacun avec ses étapes', () => {
    expect(parcours.map((p) => p.id)).toEqual([
      'vente-sans-facture',
      'vente-abattoir',
      'vente-lait',
      'vente-fromage',
      'vente-charcuterie',
      'veterinaire-traitement',
      'aliments',
      'boucles-pac',
      'achat-animaux',
      'naissance-carnet',
      'commande-client',
      'declaration-rsa',
      'sauvegarde',
    ]);
    expect(parcoursDe('vente-lait')?.etapes.map((e) => e.numero)).toEqual(['1', '2', '3', '4', '5', '5A', '6', '7', '8', '9', '10', '11']);
    expect(parcoursDe('vente-sans-facture')?.etapes.map((e) => e.numero).slice(0, 7)).toEqual(['1', '2', '3', '4', '5', '5A', '6']);
  });

  it('chaque parcours a son schéma en pictogrammes', () => {
    for (const p of parcours) expect(p.schema.length).toBeGreaterThanOrEqual(2);
    expect(parcoursDe('vente-sans-facture')?.schema).toEqual(['animal', 'commande', 'facture-barree', 'argent']);
  });

  it('une étape a un titre, un texte, et des adresses qui existent', () => {
    for (const p of parcours) {
      const numeros = p.etapes.map((e) => e.numero);
      expect(new Set(numeros).size).toBe(numeros.length);
      for (const e of p.etapes) {
        expect(e.titre.length).toBeGreaterThan(0);
        expect(e.texte.length).toBeGreaterThan(0);
        if (e.route) expect(e.route).toMatch(/^\/([a-z-]|$)/);
        if (e.route) expect(e.route).not.toContain('?');
        if (e.ouvrir) expect(e.ouvrir.split('?')[0]).toBe(e.route);
      }
    }
  });

  it('la visite guidée d’un parcours : une étape par écran, sans voile, « Suivant » ouvre l’adresse de l’étape d’après', () => {
    const etapes = etapesDuParcours('vente-lait');
    expect(etapes).toHaveLength(12);
    expect(etapes.every((e) => e.sansVoile)).toBe(true);
    expect(new Set(etapes.map((e) => e.id)).size).toBe(etapes.length);
    // De l’étape 5A (nouvelle écriture) à l’étape 6 (analyses du lait, avec son onglet) : l’adresse ouverte garde le filtre.
    const iAnalyses = etapes.findIndex((e) => e.titre.startsWith('6.'));
    const suite = etapeSuivante(etapes, iAnalyses - 1, '/comptabilite/nouvelle');
    expect(suite?.index).toBe(iAnalyses);
    expect(suite?.ouvrir).toContain('/production/controles/liste?famille=laitier');
    // Sur l’écran des analyses (sans son filtre dans l’adresse), l’étape est bien reconnue.
    expect(etapeSurLaPage(etapes[iAnalyses], '/production/controles/liste')).toBe(true);
  });

  it('« Précédent » revient à l’étape d’avant et rouvre sa page ; rien à la première étape', () => {
    const etapes = etapesDuParcours('vente-lait');
    const iAnalyses = etapes.findIndex((e) => e.titre.startsWith('6.'));
    const avant = etapePrecedente(etapes, iAnalyses, '/production/controles/liste');
    expect(avant?.index).toBe(iAnalyses - 1);
    expect(avant?.ouvrir).toContain('/comptabilite/nouvelle?type=emise&categorie=lait');
    // L’étape d’avant est sur la même page, mais précise son écran (étape de saisie, catégorie) : il s’ouvre pour la montrer.
    expect(etapePrecedente(etapes, 3, '/comptabilite/nouvelle')?.ouvrir).toContain('etape=vente');
    // Une étape sans paramètres, déjà ouverte : rien à ouvrir.
    expect(etapePrecedente(etapesDuParcours('vente-abattoir'), 5, '/comptabilite/nouvelle')?.ouvrir).toContain('/comptabilite/nouvelle');
    expect(etapePrecedente(etapes, 0, '/comptabilite/nouvelle')).toBeNull();
  });

  it('un parcours inconnu n’a pas d’étapes', () => {
    expect(etapesDuParcours('inconnu')).toEqual([]);
  });
});

describe('« Prix du produit personnalisé » par catégorie de contact', () => {
  it('d’office proposé, sauf à prix libre (le total s’y saisit déjà) ; le réglage l’emporte', () => {
    expect(prixPersonnalisePropose({ prixLibre: false })).toBe(true);
    expect(prixPersonnalisePropose({ prixLibre: true })).toBe(false);
    expect(prixPersonnalisePropose({ prixLibre: true, prixPersonnalise: true })).toBe(true);
    expect(prixPersonnalisePropose({ prixLibre: false, prixPersonnalise: false })).toBe(false);
    expect(prixPersonnalisePropose(undefined)).toBe(true);
  });
});
