import { describe, expect, it } from 'vitest';
import { pageParente } from '@/bureau/retour';
import { ingredientsProposables } from '@/features/production/services/ingredientsPlat';
import { lireArchiveStock } from '@/features/stock/repository';
import { detailDuLotDePlat } from '@/features/stock/services/detailDuPlat';
import { enregistrerRecette, fabriquerFromages, recettesDuProduit } from '@/features/stock/services/lots';
import { niveauxDeStock } from '@/features/stock/services/stock';
import { ROUTES } from '@/shared/constants/routes';

const groupes = { fromages: 'F', charcuterie: 'C', autres: 'A', fromagerie: 'Fromagerie' };

describe('recettes des fromages : présure, sel, ferments et notes', () => {
  it('la présure, le sel et les ferments lactiques sont proposés comme ingrédients de fromagerie', async () => {
    const archive = await lireArchiveStock();
    const proposes = ingredientsProposables(archive, groupes, { fromagerie: true });
    const fromagerie = proposes.filter((p) => p.groupe === 'Fromagerie').map((p) => p.libelle);
    expect(fromagerie).toEqual(expect.arrayContaining(['Présure', 'Sel', 'Ferments lactiques']));
    // Ni la casserole ni les gants : seulement ce qui entre dans le fromage.
    expect(fromagerie).not.toContain('Gants');
    expect(fromagerie).not.toContain('Casserole 40 L');
  });

  it('fabriquer un fromage sort ses ingrédients du stock et garde les notes de la recette avec ses lots', async () => {
    await fabriquerFromages({
      article: 'fromage:brocciu',
      date: '2026-10-22',
      quantite: 3,
      debut: 'FB26295-1',
      litres: 12,
      ingredients: [{ article: 'materiel:sel', quantite: 0.5, lotIds: [] }],
      notes: 'Cahier des charges AOP : lactosérum chauffé à 85 °C.',
    });
    const archive = await lireArchiveStock();
    const lot = (archive.lots ?? []).find((l) => l.numero === 'FB26295-1')!;
    expect(niveauxDeStock(archive.mouvements).get('materiel:sel')).toBe(-0.5);
    expect(archive.platsFabriques?.[lot.mouvementId as string]).toMatchObject({
      notes: 'Cahier des charges AOP : lactosérum chauffé à 85 °C.',
    });
    expect(detailDuLotDePlat(lot, archive).join(' | ')).toMatch(
      /Notes : Cahier des charges AOP.*Ingrédients : 0,5 × Sel/,
    );
  });

  it('un fromage sans ingrédient ni notes ne crée pas de fiche de fabrication', async () => {
    await fabriquerFromages({
      article: 'fromage:frais',
      date: '2026-10-23',
      quantite: 1,
      debut: 'FF26296-1',
    });
    const archive = await lireArchiveStock();
    const lot = (archive.lots ?? []).find((l) => l.numero === 'FF26296-1')!;
    expect(archive.platsFabriques?.[lot.mouvementId as string]).toBeUndefined();
  });

  it('une recette de fromage est propre à son article, une recette sans article vaut pour tout le produit', async () => {
    await enregistrerRecette({
      id: 'rf1',
      produit: 'fromage',
      article: 'fromage:frais',
      nom: 'Frais',
      ingredients: [],
    });
    await enregistrerRecette({
      id: 'rf2',
      produit: 'fromage',
      article: 'fromage:crottin',
      nom: 'Crottin',
      ingredients: [],
    });
    await enregistrerRecette({ id: 'rf3', produit: 'fromage', nom: 'Toute fromagerie', ingredients: [] });
    const archive = await lireArchiveStock();
    expect(recettesDuProduit(archive, 'fromage', 'fromage:frais').map((r) => r.nom)).toEqual([
      'Frais',
      'Toute fromagerie',
    ]);
    expect(recettesDuProduit(archive, 'fromage', 'fromage:crottin').map((r) => r.nom)).toEqual([
      'Crottin',
      'Toute fromagerie',
    ]);
    expect(recettesDuProduit(archive, 'fromage').map((r) => r.nom)).toHaveLength(3);
  });
});

describe('la flèche de retour de la version Windows', () => {
  it('les listes de lots reviennent aux lots, le dossier d’un savon à la liste des savons', () => {
    for (const page of ['fromages', 'viande', 'charcuterie', 'plats', 'savons']) {
      expect(pageParente(`/production/${page}`)).toBe(ROUTES.PRODUCTION_LOTS);
    }
    expect(pageParente('/production/savon-dossier?article=savon%3Aabc')).toBe(ROUTES.PRODUCTION_SAVONS);
    expect(pageParente('/production/recettes')).toBe('/');
    expect(pageParente('/production/registre-analyses')).toBe('/');
    expect(pageParente('/production/analyse-produit?produit=savon')).toBe(
      ROUTES.PRODUCTION_REGISTRE_ANALYSES,
    );
  });
});
