import { describe, expect, it } from 'vitest';
import { compterTransformation } from '@/features/accueil/services/transformationFerme';
import { PARAMETRES, produitAnalyse, verdictDeLAnalyse } from '@/features/analyses/services/analysesProduits';
import {
  analysesSansFabrication,
  fabricationsDuRegistre,
  produitAnalyseDeLArticle,
} from '@/features/analyses/services/registreAnalyses';
import { rappelsStockATourisme } from '@/features/commercial/services/stockATourisme';
import type { ArchiveCommercial } from '@/features/commercial/types';
import type { AnalyseProduit } from '@/features/settings/settings';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  enregistrerRecette,
  fabriquerSavons,
  recettesDuProduit,
  supprimerRecette,
} from '@/features/stock/services/lots';
import { ajouterArticle } from '@/features/stock/services/stock';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

describe('registre des analyses', () => {
  it('chaque produit a ses paramètres, et le produit d’adresse revient au fromage par défaut', () => {
    expect(PARAMETRES.plat.map((p) => p.id)).toContain('stabilite');
    expect(PARAMETRES.savon.map((p) => p.id)).toEqual([
      'flore_totale',
      'levures_moisissures',
      'pseudomonas',
      'staphylocoque_dore',
      'candida',
    ]);
    expect(produitAnalyse('savon')).toBe('savon');
    expect(produitAnalyse('plat')).toBe('plat');
    expect(produitAnalyse('n’importe quoi')).toBe('fromage');
    expect(produitAnalyse(undefined)).toBe('fromage');
  });

  it('un savon se juge d’après les repères d’un cosmétique', () => {
    const base = { produit: 'savon' as const };
    expect(verdictDeLAnalyse({ ...base, resultats: { flore_totale: 200, pseudomonas: 'absence' } })).toBe(
      'conforme',
    );
    expect(verdictDeLAnalyse({ ...base, resultats: { flore_totale: 5000 } })).toBe('non_conforme');
    expect(verdictDeLAnalyse({ ...base, resultats: { candida: 'presence' } })).toBe('non_conforme');
  });

  it('range les articles par produit d’analyse', () => {
    expect(produitAnalyseDeLArticle('fromage:frais')).toBe('fromage');
    expect(produitAnalyseDeLArticle('viande:saucisson')).toBe('charcuterie');
    expect(produitAnalyseDeLArticle('plat:civet')).toBe('plat');
    expect(produitAnalyseDeLArticle('savon:miel')).toBe('savon');
    expect(produitAnalyseDeLArticle('emballage:pot')).toBeUndefined();
  });

  it('les fabrications d’un produit avec leurs analyses rattachées, les plus récentes d’abord', async () => {
    const savon = await ajouterArticle(GENRE_ARTICLE.SAVON, 'Savon registre');
    await fabriquerSavons({
      article: savon,
      date: '2026-03-01',
      quantite: 2,
      debut: 'SR2660-1',
      ingredients: [],
    });
    await fabriquerSavons({
      article: savon,
      date: '2026-05-01',
      quantite: 3,
      debut: 'SR26121-1',
      ingredients: [],
    });
    const archive = await lireArchiveStock();
    const fabrications = fabricationsDuRegistre(archive, [], 'savon').filter((f) => f.article === savon);
    expect(fabrications.map((f) => f.date)).toEqual(['2026-05-01', '2026-03-01']);
    expect(fabrications[0]).toMatchObject({
      nombreDeLots: 3,
      numeros: 'SR26121-1 … SR26121-3',
      analyses: [],
    });

    const analyse = (id: string, fabricationId: string | undefined, date: string): AnalyseProduit => ({
      id,
      produit: 'savon',
      date,
      fabricationId,
      resultats: { flore_totale: 100 },
    });
    const analyses = [
      analyse('a1', fabrications[1].id, '2026-04-01'),
      analyse('a2', fabrications[1].id, '2026-06-01'),
      analyse('a3', undefined, '2026-02-01'),
    ];
    const avec = fabricationsDuRegistre(archive, analyses, 'savon').filter((f) => f.article === savon);
    expect(avec[1].analyses.map((a) => a.id)).toEqual(['a2', 'a1']);
    expect(avec[1].verdict).toBe('conforme');
    expect(avec[0].analyses).toEqual([]);
    expect(analysesSansFabrication(analyses, 'savon', avec).map((a) => a.id)).toEqual(['a3']);
  });
});

describe('bibliothèque de recettes', () => {
  it('garde, remplace et retire une recette', async () => {
    await enregistrerRecette({
      id: 'r1',
      produit: 'savon',
      nom: 'Miel',
      quantite: 6,
      litresLait: 1.5,
      joursCure: 42,
      ingredients: [{ article: 'perso:matieres-savon-huile-coco', quantite: 2 }],
    });
    await enregistrerRecette({ id: 'r2', produit: 'plat', nom: 'Civet', ingredients: [] });
    let archive = await lireArchiveStock();
    expect(recettesDuProduit(archive, 'savon').map((r) => r.nom)).toEqual(['Miel']);
    expect(recettesDuProduit(archive, 'plat').map((r) => r.nom)).toEqual(['Civet']);
    await enregistrerRecette({ id: 'r1', produit: 'savon', nom: 'Miel', quantite: 8, ingredients: [] });
    archive = await lireArchiveStock();
    expect(recettesDuProduit(archive, 'savon')).toHaveLength(1);
    expect(recettesDuProduit(archive, 'savon')[0].quantite).toBe(8);
    await supprimerRecette('r1');
    expect(recettesDuProduit(await lireArchiveStock(), 'savon')).toEqual([]);
  });
});

describe('stock à prévoir pour l’agritourisme', () => {
  const commercial = (extra: Partial<ArchiveCommercial> = {}): ArchiveCommercial => ({
    commandes: [],
    tarifs: {},
    formules: [
      {
        id: 'f1',
        nom: 'Repas',
        prix: 30,
        elements: [],
        besoins: [
          { article: 'perso:denrees-farine', quantite: 0.5, parPersonne: true },
          { article: 'perso:denrees-oeufs', quantite: 6 },
        ],
      },
    ],
    visites: [
      {
        id: 'v1',
        date: '2026-10-25',
        client: 'Groupe école',
        formuleId: 'f1',
        formule: 'Repas',
        participants: 10,
        prixParPersonne: 30,
        statut: 'prevue',
      },
      {
        id: 'v2',
        date: '2026-12-25',
        client: 'Loin',
        formuleId: 'f1',
        formule: 'Repas',
        participants: 4,
        prixParPersonne: 30,
        statut: 'prevue',
      },
      {
        id: 'v3',
        date: '2026-10-24',
        client: 'Faite',
        formuleId: 'f1',
        formule: 'Repas',
        participants: 4,
        prixParPersonne: 30,
        statut: 'realisee',
      },
    ],
    ...extra,
  });

  it('une visite des sept jours qui viennent : ce qu’il faut préparer et ce qui manque', async () => {
    const stock = await lireArchiveStock();
    const rappels = rappelsStockATourisme(commercial(), stock, [], '2026-10-22');
    expect(rappels).toHaveLength(1);
    expect(rappels[0]).toMatchObject({ echeance: '2026-10-25', enRetard: true });
    expect(rappels[0].libelle).toMatch(/Groupe école/);
    expect(rappels[0].detail).toMatch(/5 × Farine/);
    expect(rappels[0].detail).toMatch(/il manque 5 × Farine, 6 × Œufs/);
  });

  it('le stock qui suffit n’est plus en rouge, et une préparation validée ne revient pas', async () => {
    const base = await lireArchiveStock();
    const stock = {
      ...base,
      mouvements: [
        ...base.mouvements,
        {
          id: 'm-farine',
          article: 'perso:denrees-farine',
          date: '2026-10-01',
          delta: 20,
          origine: 'manuel' as const,
        },
        {
          id: 'm-oeufs',
          article: 'perso:denrees-oeufs',
          date: '2026-10-01',
          delta: 12,
          origine: 'manuel' as const,
        },
      ],
    };
    const rappels = rappelsStockATourisme(commercial(), stock, [], '2026-10-22');
    expect(rappels[0].enRetard).toBe(false);
    expect(rappels[0].detail).not.toMatch(/il manque/);
    expect(rappelsStockATourisme(commercial(), stock, [rappels[0].id], '2026-10-22')).toEqual([]);
    // L'identifiant ne ressemble pas à une déclaration de l'année (« :2026- ») : il ne compte pas dans les papiers.
    expect(rappels[0].id).not.toMatch(/:2026-/);
  });

  it('une commande ouverte à livrer bientôt demande aussi son stock', async () => {
    const stock = await lireArchiveStock();
    const rappels = rappelsStockATourisme(
      commercial({
        visites: [],
        commandes: [
          {
            id: 'c1',
            numero: 'C-1',
            client: 'Mme Dupont',
            date: '2026-10-20',
            livraisonPrevue: '2026-10-24',
            statut: 'a_preparer',
            lignes: [{ id: 'l1', article: 'fromage:frais', libelle: 'Frais', quantite: 3, prixUnitaire: 5 }],
          },
          {
            id: 'c2',
            numero: 'C-2',
            client: 'Livrée',
            date: '2026-10-01',
            livraisonPrevue: '2026-10-24',
            statut: 'livree',
            lignes: [],
          },
        ],
      }),
      stock,
      [],
      '2026-10-22',
    );
    expect(rappels).toHaveLength(1);
    expect(rappels[0].libelle).toMatch(/Mme Dupont/);
    expect(rappels[0].detail).toMatch(/3 × /);
  });
});

describe('le travail du produit compte aussi les plats et les savons', () => {
  it('additionne les niveaux positifs de chaque produit', () => {
    const niveaux: Record<string, number> = { 'plat:a': 4, 'plat:b': -2, 'savon:a': 6 };
    const c = compterTransformation({
      fromages: [],
      viande: [],
      plats: [{ cle: 'plat:a' }, { cle: 'plat:b' }],
      savons: [{ cle: 'savon:a' }],
      niveau: (cle) => niveaux[cle] ?? 0,
      role: () => undefined,
    });
    expect(c).toMatchObject({ plats: 4, savons: 6 });
  });
});
