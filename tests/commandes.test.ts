import { describe, expect, it } from 'vitest';
import { elementsAFacturer, estLigneDeViande, totalDuBon, venteDeLaLigne } from '@/features/commercial/services/commandes';
import type { Commande, LigneCommande } from '@/features/commercial/types';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';

const commande = { id: 'c1', numero: 'C-1', client: 'Marie', date: '2026-10-17', statut: 'a_preparer', lignes: [] } as unknown as Commande;
const ligne = (article: string, libelle: string): LigneCommande => ({ id: 'l', article, libelle, quantite: 3, prixUnitaire: 8 });

describe('commandes : fromages, viande et charcuterie', () => {
  it('une ligne de viande se livre en vente de boucherie / charcuterie, au nom de la ligne de l’inventaire', () => {
    expect(estLigneDeViande('viande:saucisson')).toBe(true);
    expect(estLigneDeViande('fromage:frais')).toBe(false);
    const vente = venteDeLaLigne(commande, ligne('viande:saucisson', 'Saucisson'), '2026-10-20', 'chevre' as never, false);
    expect(vente.categorie).toBe(CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE);
    expect(vente.precision).toBe('Saucisson');
    expect(vente.quantite).toBe(3);
    expect(vente.prix).toBe(24);
    expect(vente.commandeId).toBe('c1');
  });

  it('une ligne de fromage reste une vente de fromage', () => {
    const vente = venteDeLaLigne(commande, ligne('fromage:frais', 'Frais'), '2026-10-20', 'chevre' as never, false);
    expect(vente.categorie).toBe(CATEGORIE_VENTE.FROMAGE);
    expect(vente.typeFromage).toBe('frais');
  });
});

describe('bon de commande : ce qu’il reste à facturer', () => {
  it('liste les lignes pas encore facturées et les animaux réservés', () => {
    const bon = {
      id: 'c1',
      numero: 'C-1',
      client: 'Momo',
      date: '2026-10-17',
      statut: 'a_preparer',
      lignes: [ligne('fromage:frais', 'Frais'), { ...ligne('viande:saucisson', 'Saucisson'), id: 'l2' }],
      lignesFacturees: ['l2'],
    } as unknown as Commande;
    const elements = elementsAFacturer(bon, ['a1', 'a2']);
    expect(elements.map((e) => e.type)).toEqual(['ligne', 'animaux']);
    expect(elementsAFacturer({ ...bon, lignesFacturees: ['l', 'l2'] }, [])).toEqual([]);
  });

  it('une ligne de lots réservés désigne ses lots dans la vente', () => {
    const vente = venteDeLaLigne(
      commande,
      { ...ligne('fromage:frais', 'Frais'), lotIds: ['x', 'y'] },
      '2026-10-20',
      'chevre' as never,
      false,
    );
    expect(vente.fromages).toBe('x;y');
  });
});

describe('total d’un bon de commande', () => {
  it('ajoute ce que ses ventes ont facturé (animaux compris) aux lignes pas encore facturées', () => {
    const bon = {
      id: 'c1',
      numero: 'C-1',
      client: 'Momo',
      date: '2026-10-17',
      statut: 'livree',
      lignes: [{ ...ligne('fromage:frais', 'Frais'), id: 'l1' }, { ...ligne('fromage:frais', 'Frais'), id: 'l2', quantite: 1, prixUnitaire: 5 }],
      lignesFacturees: ['l1'],
      venteIds: ['v1', 'v2'],
    } as unknown as Commande;
    // l1 facturée avec v1 (24 €), animaux facturés avec v2 (80 €), l2 (5 €) reste à facturer.
    expect(totalDuBon(bon, new Map([['v1', 24], ['v2', 80]]))).toBe(109);
    expect(totalDuBon({ ...bon, venteIds: undefined, lignesFacturees: undefined }, new Map())).toBe(29);
  });
});
