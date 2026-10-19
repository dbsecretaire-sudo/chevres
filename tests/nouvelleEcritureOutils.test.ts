import { describe, expect, it } from 'vitest';
import { optionsDesComptes } from '@/features/comptabilite/utils/optionsComptes';
import { detailDesAnimaux } from '@/features/comptabilite/forms/detailDesAnimaux';
import { articlesDuGenre, cleArticle } from '@/features/stock/services/stock';
import { GENRE_ARTICLE, ROLE_VIANDE } from '@/shared/constants/stock';
import type { ArchiveStock } from '@/features/stock/types';
import type { Chevre } from '@/features/cheptel/types';

const compte = (numero: string, libelle: string) => ({ numero, libelle }) as never;

describe('listes de comptes d’une écriture', () => {
  const comptes = [compte('601000', 'Achats'), compte('607000', 'Marchandises'), compte('701000', 'Ventes')];

  it('sépare les charges (6…) et les produits (7…)', () => {
    const o = optionsDesComptes(comptes, 'chevres', []);
    expect(o.comptesDepense.map((c) => c.numero)).toEqual(['601000', '607000']);
    expect(o.optionsCompteRecette.map((c) => c.value)).toEqual(['701000']);
    expect(o.optionsCompteRecette[0].label).toBe('701000 — Ventes');
  });

  it('place d’abord les comptes de l’inventaire, sous leur titre', () => {
    const o = optionsDesComptes(comptes, 'chevres', ['607000']);
    expect(o.optionsCompteDepense.map((c) => c.value)).toEqual(['607000', '601000']);
    expect(o.optionsCompteDepense[0].groupe).not.toBe(o.optionsCompteDepense[1].groupe);
  });
});

describe('détail d’une vente d’animaux d’un bon', () => {
  const archive = { mouvements: [], articles: [], conditionnements: {}, ordres: {}, noms: {}, lait: [], prix: {} } as unknown as ArchiveStock;
  const libelle = (role: string) =>
    articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, 'chevres' as never).find((a) => a.cle === cleArticle(GENRE_ARTICLE.VIANDE, `chevres_${role}`))?.libelle;
  const animal = (naissance: string) => ({ id: naissance, sexe: 'F', statut: 'vivante', dateNaissance: naissance, espece: 'chevres' }) as unknown as Chevre;

  it('des animaux déjà adultes à la date de la facture : la ligne des adultes (vivants ou sur pied)', () => {
    const adultes = [animal('2020-01-01')];
    expect(detailDesAnimaux(adultes, 'vivants', '2026-10-19', archive).petits).toBe(false);
    expect(detailDesAnimaux(adultes, 'vivants', '2026-10-19', archive).libelle).toBe(libelle(ROLE_VIANDE.VIVANT));
    expect(detailDesAnimaux(adultes, 'morts', '2026-10-19', archive).libelle).toBe(libelle(ROLE_VIANDE.SUR_PIED));
  });

  it('des petits (nés il y a quelques semaines) : la ligne des cabris', () => {
    const petits = [animal('2026-10-01')];
    const d = detailDesAnimaux(petits, undefined, '2026-10-19', archive);
    expect(d.petits).toBe(true);
    expect(d.libelle).toBe(libelle(ROLE_VIANDE.JEUNE));
  });
});
