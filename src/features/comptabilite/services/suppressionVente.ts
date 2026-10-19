import { getChevre, listTousLesAnimauxDeLEspece, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { listToutesVentes, supprimerVente } from '@/features/comptabilite/repository/ventes';
import { commandeApresSuppressionDeVente } from '@/features/commercial/services/reservations';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { idsDesAnimaux, revientVivantApresLaVente } from '@/features/comptabilite/utils/ventes';
import { animauxDuLot } from '@/features/exploitation/services/lots';
import { getSettings } from '@/features/settings/settings';

/**
 * Supprime une vente et remet dans le cheptel ses animaux : ceux vendus, et ceux envoyés vivants à l'abattoir (la facture de leur
 * identification et de leur transport disparaît). Un animal abattu dont la vente portait sur la viande garde son statut.
 */
export async function supprimerLaVenteEtRemettreLesAnimaux(vente: Vente): Promise<void> {
  await supprimerVente(vente.id);
  // La commande de cette vente (livrée) est annulée : ses réservations sont libérées.
  await commandeApresSuppressionDeVente(vente);
  for (const id of idsDesAnimaux(vente)) {
    if (revientVivantApresLaVente((await getChevre(id))?.statut, vente)) await reactiverChevre(id);
  }
}

/**
 * Les ventes aux clients qui portent les animaux du lot d'abattoir lié à cette dépense de l'abattoir (rien pour une facture sans lot) : celles
 * qu'on propose de supprimer en même temps que la dépense.
 */
export async function ventesDuLotDeLaFacture(facture: Pick<Facture, 'id'>): Promise<Vente[]> {
  const lot = (await getSettings()).exploitation?.lots?.find((l) => l.factureId === facture.id && l.abattoir);
  if (!lot) return [];
  const ids = new Set(animauxDuLot(lot, await listTousLesAnimauxDeLEspece()).map((a) => a.id));
  return (await listToutesVentes()).filter((v) => idsDesAnimaux(v).some((id) => ids.has(id)));
}
