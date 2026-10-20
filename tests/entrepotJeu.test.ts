import { describe, expect, it } from 'vitest';
import {
  carteDesOeufs,
  carteDuLait,
  emojiDeLaCategorie,
  emojiDeLArticle,
  formaterQuantite,
  groupesDeLaCategorie,
  nombreEnStock,
  uniteDuGenre,
  type LectureDuStock,
} from '@/features/stock/services/entrepotJeu';
import type { CategorieDuStock } from '@/features/stock/utils/structureStock';
import { CATEGORIE_INVENTAIRE, GENRE_ARTICLE, SECTION_STOCK } from '@/shared/constants/stock';

const categorie = (partiel: Partial<CategorieDuStock>): CategorieDuStock =>
  ({ categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS, nom: 'Produits finis', classe: '35', prefixes: [], perso: false, sections: [], listes: [], ...partiel }) as CategorieDuStock;

describe('entrepôt en style jeu', () => {
  it('écrit une quantité en entier, avec ses milliers, sans « k »', () => {
    expect(formaterQuantite(4250).replace(/\s/g, ' ')).toBe('4 250');
    expect(formaterQuantite(90)).toBe('90');
    expect(formaterQuantite(12.54)).toBe('12,5');
    expect(formaterQuantite(0)).toBe('0');
    expect(formaterQuantite(-3)).toBe('-3');
  });

  it('les aliments se comptent en kilos, le reste en nombre', () => {
    expect(uniteDuGenre(GENRE_ARTICLE.ALIMENT)).toBe('kg');
    expect(uniteDuGenre(GENRE_ARTICLE.FROMAGE)).toBeUndefined();
  });

  it('donne un dessin à chaque catégorie et à chaque article', () => {
    expect(emojiDeLaCategorie(CATEGORIE_INVENTAIRE.PRODUITS_FINIS)).toBe('🧀');
    expect(emojiDeLaCategorie(CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX)).toBe('🐐');
    expect(emojiDeLaCategorie('perso:abc')).toBe('🗂️');
    expect(emojiDeLArticle(GENRE_ARTICLE.ALIMENT, 'Maïs')).toBe('🌽');
    expect(emojiDeLArticle(GENRE_ARTICLE.ALIMENT, 'Luzerne')).toBe('🌿');
    expect(emojiDeLArticle(GENRE_ARTICLE.VIANDE, 'Saucisson')).toBe('🥓');
    expect(emojiDeLArticle(GENRE_ARTICLE.VIANDE, 'Cabris')).toBe('🐐');
  });

  it('range les rubriques comme le stock : les rubriques d’office, puis les listes ajoutées, avec ce qui est en stock d’abord', () => {
    const lecture: LectureDuStock = {
      articlesDe: (genre, _section, listeId) =>
        listeId ? [{ cle: 'perso:laine', libelle: 'Laine' }] : genre === GENRE_ARTICLE.FROMAGE ? [{ cle: 'fromage:frais', libelle: 'Frais' }, { cle: 'fromage:tomme', libelle: 'Tomme' }] : [],
      niveau: (cle) => ({ 'fromage:tomme': 12, 'perso:laine': 3 })[cle] ?? 0,
      lait: carteDuLait('Lait', 40),
    };
    const groupes = groupesDeLaCategorie(
      categorie({
        sections: [
          { section: SECTION_STOCK.FROMAGES, categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS, titre: 'Ventes — Fromages', genre: GENRE_ARTICLE.FROMAGE },
          { section: SECTION_STOCK.LAIT, categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS, titre: 'Ventes — Lait' },
        ],
        listes: [{ id: 'l1', categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS, nom: 'Ventes — Laine, peaux', compte: '701400', libelleCompte: '' }],
      }),
      lecture,
    );
    expect(groupes.map((g) => g.titre)).toEqual(['Ventes — Fromages', 'Ventes — Lait', 'Ventes — Laine, peaux']);
    expect(groupes[0].cartes.map((c) => c.titre)).toEqual(['Tomme', 'Frais']);
    expect(groupes[1].cartes).toEqual([carteDuLait('Lait', 40)]);
    expect(groupes[2].cartes[0]).toMatchObject({ titre: 'Laine', niveau: 3, section: CATEGORIE_INVENTAIRE.PRODUITS_FINIS });
    expect(nombreEnStock(groupes)).toBe(3);
  });

  it('les aliments portent leur unité, le lait et les œufs aussi', () => {
    const lecture: LectureDuStock = { articlesDe: () => [{ cle: 'aliment:luzerne', libelle: 'Luzerne' }], niveau: () => 4250 };
    const [g] = groupesDeLaCategorie(
      categorie({ categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES, sections: [{ section: SECTION_STOCK.ALIMENTS, categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES, titre: 'Achat — Aliment', genre: GENRE_ARTICLE.ALIMENT }] }),
      lecture,
    );
    expect(g.cartes[0]).toMatchObject({ niveau: 4250, unite: 'kg', emoji: '🌿' });
    expect(carteDuLait('Lait', 5).unite).toBe('L');
    expect(carteDesOeufs('Œufs', 0.4).unite).toBe('€');
  });
});
