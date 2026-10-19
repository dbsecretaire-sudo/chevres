import { describe, expect, it } from 'vitest';
import { enregistrerCommande, getCommande } from '@/features/commercial/repository';
import { annulerLesCommandesSansVente, commandeApresSuppressionDeVente } from '@/features/commercial/services/reservations';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import { STATUT_COMMANDE } from '@/shared/constants/commercial';

const base = { client: 'Estelle', date: '2026-05-19', circuit: 'ferme' };
const ligne = { id: 'l1', article: 'fromage:frais', libelle: 'Frais', quantite: 2, prixUnitaire: 8, lotIds: ['FF1', 'FF2'] };

describe('une facture supprimée défait sa commande', () => {
  it('annule la commande livrée dont c’était la seule vente : plus de vente, plus de lots réservés', async () => {
    const bon = await enregistrerCommande({ ...base, statut: STATUT_COMMANDE.LIVREE, lignes: [ligne], venteIds: ['v1'], lignesFacturees: ['l1'] });
    await commandeApresSuppressionDeVente({ id: 'v1', commandeId: bon.id });
    const apres = await getCommande(bon.id);
    expect(apres?.statut).toBe(STATUT_COMMANDE.ANNULEE);
    expect(apres?.venteIds).toBeUndefined();
    expect(apres?.lignesFacturees).toBeUndefined();
    expect(apres?.lignes[0].lotIds).toBeUndefined();
  });

  it('les fromages réservés de la commande annulée sont de nouveau libres en stock', async () => {
    const archive = await lireArchiveStock();
    const lot = (id: string) => ({ id, article: 'fromage:frais', numero: id, dateFabrication: '2026-05-17', reservation: { client: 'Estelle', date: '2026-05-19' } });
    await remplacerArchiveStock({ ...archive, lots: [lot('FF1'), lot('FF2'), lot('AUTRE')] });
    const bon = await enregistrerCommande({ ...base, statut: STATUT_COMMANDE.LIVREE, lignes: [ligne], venteIds: ['v1'] });
    await commandeApresSuppressionDeVente({ id: 'v1', commandeId: bon.id });
    const lots = (await lireArchiveStock()).lots ?? [];
    expect(lots.find((l) => l.id === 'FF1')?.reservation).toBeUndefined();
    expect(lots.find((l) => l.id === 'FF2')?.reservation).toBeUndefined();
    // Les fromages réservés pour une autre commande ne bougent pas.
    expect(lots.find((l) => l.id === 'AUTRE')?.reservation?.client).toBe('Estelle');
  });

  it('même chose pour la charcuterie : ses lots, réservés dans le même stock, sont libérés', async () => {
    const archive = await lireArchiveStock();
    const saucisson = (id: string) => ({ id, article: 'viande:saucisson', numero: id, dateFabrication: '2026-05-17', reservation: { client: 'Estelle', date: '2026-05-19' } });
    await remplacerArchiveStock({ ...archive, lots: [saucisson('BS1'), saucisson('BS2')] });
    const lignesCharcuterie = [{ id: 'l2', article: 'viande:saucisson', libelle: 'Saucisson', quantite: 2, prixUnitaire: 9, lotIds: ['BS1', 'BS2'] }];
    const bon = await enregistrerCommande({ ...base, statut: STATUT_COMMANDE.LIVREE, lignes: lignesCharcuterie, venteIds: ['v7'] });
    await commandeApresSuppressionDeVente({ id: 'v7', commandeId: bon.id });
    expect((await getCommande(bon.id))?.statut).toBe(STATUT_COMMANDE.ANNULEE);
    expect(((await lireArchiveStock()).lots ?? []).filter((l) => l.reservation)).toEqual([]);
  });

  it('garde la commande livrée quand une autre de ses ventes existe, en oubliant seulement celle-ci', async () => {
    const bon = await enregistrerCommande({ ...base, statut: STATUT_COMMANDE.LIVREE, lignes: [ligne], venteIds: ['v1', 'v2'] });
    await commandeApresSuppressionDeVente({ id: 'v1', commandeId: bon.id });
    const apres = await getCommande(bon.id);
    expect(apres?.statut).toBe(STATUT_COMMANDE.LIVREE);
    expect(apres?.venteIds).toEqual(['v2']);
  });

  it('une commande encore ouverte retrouve ses lignes à facturer', async () => {
    const bon = await enregistrerCommande({ ...base, statut: STATUT_COMMANDE.PREPAREE, lignes: [ligne], venteIds: ['v1'], lignesFacturees: ['l1'] });
    await commandeApresSuppressionDeVente({ id: 'v1', commandeId: bon.id });
    const apres = await getCommande(bon.id);
    expect(apres?.statut).toBe(STATUT_COMMANDE.PREPAREE);
    expect(apres?.lignesFacturees).toBeUndefined();
    expect(apres?.lignes[0].lotIds).toEqual(['FF1', 'FF2']);
  });

  it('une vente sans commande ne change rien', async () => {
    await expect(commandeApresSuppressionDeVente({ id: 'v9', commandeId: undefined })).resolves.toBeUndefined();
  });

  it('annule d’office une commande livrée dont les ventes n’existent plus', async () => {
    const orpheline = await enregistrerCommande({ ...base, statut: STATUT_COMMANDE.LIVREE, lignes: [ligne], venteIds: ['disparue'] });
    const sansTrace = await enregistrerCommande({ ...base, statut: STATUT_COMMANDE.LIVREE, lignes: [ligne] });
    await annulerLesCommandesSansVente();
    expect((await getCommande(orpheline.id))?.statut).toBe(STATUT_COMMANDE.ANNULEE);
    // Sans aucune vente connue (commande d'avant les ventes) : on n'y touche pas.
    expect((await getCommande(sansTrace.id))?.statut).toBe(STATUT_COMMANDE.LIVREE);
  });
});
