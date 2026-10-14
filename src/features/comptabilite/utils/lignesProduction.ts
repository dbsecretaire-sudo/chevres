import type { Facture, LigneProduction } from '@/features/comptabilite/types';

/**
 * Les fournitures d'un achat de production : le détail par fourniture quand il y en a un, sinon (une facture d'avant le détail) l'article
 * unique de la facture avec son montant. Rien pour un achat qui n'entre pas au stock.
 */
export function lignesProductionDe(
  facture: Pick<Facture, 'lignesProduction' | 'stockArticle' | 'stockQuantite' | 'bouclesDebut' | 'montant'>,
): LigneProduction[] {
  if (facture.lignesProduction && facture.lignesProduction.length > 0) return facture.lignesProduction;
  if (!facture.stockArticle) return [];
  return [
    {
      article: facture.stockArticle,
      quantite: facture.stockQuantite,
      montant: facture.montant,
      bouclesDebut: facture.bouclesDebut,
    },
  ];
}
