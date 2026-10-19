import { describe, expect, it } from 'vitest';
import {
  carteDuLait,
  cartesDeLOnglet,
  emojiDeLArticle,
  formaterQuantite,
  nombreEnStock,
  ONGLETS_ENTREPOT,
  sectionDuGenre,
} from '@/features/stock/services/entrepotJeu';
import { GENRE_ARTICLE, SECTION_STOCK } from '@/shared/constants/stock';

describe('entrepôt en style jeu', () => {
  it('écrit une quantité en peu de place', () => {
    expect(formaterQuantite(90)).toBe('90');
    expect(formaterQuantite(0)).toBe('0');
    expect(formaterQuantite(12.5)).toBe('12,5');
    expect(formaterQuantite(1800)).toBe('1,8 k');
    expect(formaterQuantite(28800)).toBe('28,8 k');
    expect(formaterQuantite(-3)).toBe('-3');
  });

  it('donne un dessin à chaque article, plus précis quand son nom le dit', () => {
    expect(emojiDeLArticle(GENRE_ARTICLE.FROMAGE, 'Tomme')).toBe('🧀');
    expect(emojiDeLArticle(GENRE_ARTICLE.ALIMENT, 'Maïs')).toBe('🌽');
    expect(emojiDeLArticle(GENRE_ARTICLE.ALIMENT, 'Foin de luzerne')).toBe('🌿');
    expect(emojiDeLArticle(GENRE_ARTICLE.VIANDE, 'Saucisson')).toBe('🥓');
    expect(emojiDeLArticle(GENRE_ARTICLE.VIANDE, 'Côtelettes')).toBe('🥩');
    expect(emojiDeLArticle(GENRE_ARTICLE.BOUCLE, 'Boucles')).toBe('🏷️');
  });

  it('renvoie chaque genre vers sa rubrique du stock', () => {
    expect(sectionDuGenre(GENRE_ARTICLE.ALIMENT)).toBe(SECTION_STOCK.ALIMENTS);
    expect(sectionDuGenre(GENRE_ARTICLE.BATIMENT)).toBe(SECTION_STOCK.MATERIEL);
    expect(sectionDuGenre(GENRE_ARTICLE.FROMAGE)).toBe(SECTION_STOCK.FROMAGES);
  });

  it('range les cartes : ce qui est en stock d’abord, les lignes du cheptel exclues', () => {
    const vente = ONGLETS_ENTREPOT.find((o) => o.cle === 'vente')!;
    const par = new Map([
      [GENRE_ARTICLE.FROMAGE, [{ cle: 'fromage:frais', libelle: 'Frais' }, { cle: 'fromage:tomme', libelle: 'Tomme' }]],
      [GENRE_ARTICLE.VIANDE, [{ cle: 'viande:chevres_jeune', libelle: 'Cabris' }, { cle: 'viande:saucisson', libelle: 'Saucisson' }]],
    ]) as never;
    const niveaux = new Map([['fromage:tomme', 12], ['viande:saucisson', 0]]);
    const cartes = cartesDeLOnglet(vente, par, niveaux, (cle) => cle.endsWith('_jeune'));
    expect(cartes.map((c) => c.titre)).toEqual(['Tomme', 'Frais', 'Saucisson']);
    expect(nombreEnStock(cartes)).toBe(1);
  });

  it('a quatre onglets et chaque genre d’article tient dans un onglet', () => {
    expect(ONGLETS_ENTREPOT).toHaveLength(4);
    const genres = ONGLETS_ENTREPOT.flatMap((o) => o.genres);
    expect(new Set(genres).size).toBe(genres.length);
    expect(genres).toEqual(expect.arrayContaining(Object.values(GENRE_ARTICLE)));
  });
});

describe('le lait et les animaux dans « à vendre »', () => {
  it('ajoute la carte du lait, en litres, à l’onglet « à vendre » seulement', () => {
    const lait = carteDuLait('Lait', 42);
    expect(lait).toMatchObject({ emoji: '🥛', niveau: 42, unite: 'L', section: SECTION_STOCK.LAIT });
    const vente = ONGLETS_ENTREPOT.find((o) => o.cle === 'vente')!;
    const aliments = ONGLETS_ENTREPOT.find((o) => o.cle === 'aliments')!;
    const vide = new Map() as never;
    expect(cartesDeLOnglet(vente, vide, new Map(), () => false, [lait]).map((c) => c.cle)).toEqual(['lait']);
    expect(cartesDeLOnglet(aliments, vide, new Map(), () => false, [lait])).toEqual([]);
  });

  it('garde les lignes des animaux (cabris, sur pied, vivant) quand on ne les écarte pas, avec la quantité du troupeau', () => {
    const vente = ONGLETS_ENTREPOT.find((o) => o.cle === 'vente')!;
    const par = new Map([[GENRE_ARTICLE.VIANDE, [{ cle: 'viande:chevres_jeune', libelle: 'Cabris' }]]]) as never;
    const cartes = cartesDeLOnglet(vente, par, new Map([['viande:chevres_jeune', 18]]), () => false);
    expect(cartes).toHaveLength(1);
    expect(cartes[0]).toMatchObject({ titre: 'Cabris', niveau: 18 });
  });
});
