import { describe, expect, it } from 'vitest';
import { articlesDuGenre, cleArticle, totalDeLaVente } from '@/features/stock/services/stock';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { GENRE_ARTICLE, ROLE_VIANDE } from '@/shared/constants/stock';
import type { ArchiveStock } from '@/features/stock/types';
import type { Vente } from '@/features/comptabilite/types';

const archive = (prix: Record<string, number>): ArchiveStock =>
  ({ mouvements: [], articles: [], conditionnements: {}, ordres: {}, noms: {}, lait: [], prix }) as unknown as ArchiveStock;

const vente = (precision: string, extra: Partial<Vente> = {}): Vente =>
  ({ id: 'v', date: '2026-10-19', categorie: CATEGORIE_VENTE.VIANDE, precision, activite: 'chevres', quantite: 3, prix: 0, tauxTva: 10, ...extra }) as unknown as Vente;

describe('prix d’une vente d’animaux : à la tête pour un animal vivant, au kilo sinon', () => {
  const cle = (role: string) => cleArticle(GENRE_ARTICLE.VIANDE, `chevres_${role}`);
  const libelle = (role: string, a: ArchiveStock) => articlesDuGenre(GENRE_ARTICLE.VIANDE, a, 'chevres' as never).find((x) => x.cle === cle(role))!.libelle;

  it('un animal vivant : le prix d’un animal × leur nombre (le poids ne compte pas)', () => {
    const a = archive({ [cle(ROLE_VIANDE.VIVANT)]: 120 });
    expect(totalDeLaVente(vente(libelle(ROLE_VIANDE.VIVANT, a), { poidsKg: 55 }), a)).toBe(360);
  });

  it('un animal sur pied : le poids × le prix au kilo vif', () => {
    const a = archive({ [cle(ROLE_VIANDE.SUR_PIED)]: 4 });
    expect(totalDeLaVente(vente(libelle(ROLE_VIANDE.SUR_PIED, a), { poidsKg: 55 }), a)).toBe(220);
  });
});
