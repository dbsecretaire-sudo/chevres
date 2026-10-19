import { describe, expect, it } from 'vitest';
import { fromCSV, fromCSVParAnnees, toCSV, toCSVParAnnees } from '@/shared/storage/csv';

describe('fichiers de Drive : les champs ajoutés ne se perdent pas', () => {
  it('une vente garde l’état des animaux et son caractère offert', () => {
    const vente = {
      id: 'v1',
      activite: 'chevres',
      date: '2026-03-02',
      categorie: 'viande',
      quantite: 2,
      unite: 'piece',
      prix: 0,
      tauxTva: 10,
      etatAnimaux: 'vivants',
      offert: true,
    } as never;
    const [relue] = fromCSV('ventes', toCSV('ventes', [vente])) as unknown as Record<string, unknown>[];
    expect(relue.etatAnimaux).toBe('vivants');
    expect(relue.offert).toBe(true);
  });

  it('un animal garde sa réservation (client, bon de commande, état)', () => {
    const animal = {
      id: 'a1',
      sexe: 'M',
      dateNaissance: '2026-01-02',
      statut: 'vivante',
      reservation: { client: 'Momo', clientId: 'c1', commandeId: 'b1', etat: 'morts', date: '2026-10-17' },
    } as never;
    const [relu] = fromCSV('cheptel', toCSV('cheptel', [animal])) as unknown as Record<string, unknown>[];
    expect(relu.reservation).toEqual({ client: 'Momo', clientId: 'c1', commandeId: 'b1', etat: 'morts', date: '2026-10-17' });
  });
});

describe('fichier unique par catégorie sur Drive', () => {
  it('garde l’année de chaque ligne, toutes années dans un seul fichier', () => {
    const vente = (id: string, date: string) =>
      ({ id, activite: 'chevres', date, categorie: 'viande', quantite: 1, unite: 'piece', prix: 10, tauxTva: 10 }) as never;
    const csv = toCSVParAnnees('ventes', [
      { annee: 2025, items: [vente('a', '2025-12-31')] },
      { annee: 2026, items: [vente('b', '2026-01-01'), vente('c', '2026-03-02')] },
    ]);
    const relu = fromCSVParAnnees('ventes', csv);
    expect([...relu.keys()]).toEqual([2025, 2026]);
    expect(relu.get(2025)?.map((v) => (v as unknown as { id: string }).id)).toEqual(['a']);
    expect(relu.get(2026)?.map((v) => (v as unknown as { id: string }).id)).toEqual(['b', 'c']);
    // Une catégorie sans donnée donne un fichier vide d'années.
    expect(fromCSVParAnnees('ventes', toCSVParAnnees('ventes', [])).size).toBe(0);
  });
});

describe('fichiers de Drive : vente au poids vif, prix personnalisé, dépense offerte', () => {
  it('une vente garde son prix au poids vif et son prix unitaire personnalisé', () => {
    const vente = {
      id: 'v2', activite: 'chevres', date: '2026-10-19', categorie: 'viande', quantite: 3, unite: 'piece', prix: 275, tauxTva: 10,
      venduAuPoids: true, prixUnitairePersonnalise: 5,
    } as never;
    const [relue] = fromCSV('ventes', toCSV('ventes', [vente])) as unknown as Record<string, unknown>[];
    expect(relue.venduAuPoids).toBe(true);
    expect(relue.prixUnitairePersonnalise).toBe(5);
  });

  it('une dépense offerte garde ses lignes offertes (aliments, marchandises, fournitures)', () => {
    const facture = {
      id: 'f1', date: '2026-10-19', activite: 'chevres', type: 'recue', tiers: 'X', description: '', montant: 40, offert: true,
      categorieDepense: 'alimentation',
      lignesAlimentation: [
        { type: 'foin', montant: 0, quantiteKg: 100, offert: true },
        { type: 'luzerne', montant: 40 },
      ],
      lignesMarchandises: [{ marchandise: 'Bière', rubrique: 'bar', quantite: 24, unite: 'piece', montant: 0, offert: true }],
      lignesProduction: [{ article: 'perso:sel', quantite: 12, montant: 0, offert: true }],
    } as never;
    const [relue] = fromCSV('factures', toCSV('factures', [facture])) as unknown as Record<string, any>[];
    expect(relue.offert).toBe(true);
    expect(relue.lignesAlimentation[0]).toMatchObject({ type: 'foin', montant: 0, quantiteKg: 100, offert: true });
    expect(relue.lignesAlimentation[1].offert).toBeUndefined();
    expect(relue.lignesMarchandises[0]).toMatchObject({ marchandise: 'Bière', quantite: 24, offert: true });
    expect(relue.lignesProduction[0]).toMatchObject({ article: 'perso:sel', quantite: 12, offert: true });
  });
});
