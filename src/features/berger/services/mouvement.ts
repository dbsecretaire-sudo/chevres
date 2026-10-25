import type { Chevre } from '@/features/cheptel/types';
import { declarerStatutChevre, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import { lotDuBonDeLivraison } from '@/features/lots-animaux/services/departDAnimaux';
import { getSettings, updateSettings, type LotAnimaux } from '@/features/settings/settings';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';

/**
 * Les lots une fois la chèvre envoyée à l'abattoir : son numéro entre dans le bon de livraison du jour (un bon est créé s'il n'existe pas).
 * Le bon est un départ : le document de circulation qui le manque reste suivi, comme pour le mode avancé.
 */
export function lotsApresEnvoiAbattoir(lots: readonly LotAnimaux[], boucle: string, date: string): LotAnimaux[] {
  return lotDuBonDeLivraison(lots, { date, boucles: boucle ? [boucle] : [] }).lots;
}

/** Les lots une fois l'envoi annulé : la chèvre sort du bon du jour, et un bon qui n'a plus d'animaux disparaît. */
export function lotsApresAnnulationAbattoir(lots: readonly LotAnimaux[], boucle: string, date: string): LotAnimaux[] {
  return lots.flatMap((lot) => {
    if (!lot.depart || lot.abattoir !== date) return [lot];
    const restantes = numerosDeBoucles(lot.boucles).filter((numero) => numero !== boucle);
    return restantes.length === 0 ? [] : [{ ...lot, boucles: restantes.join(', ') }];
  });
}

/** L'envoi à l'abattoir : la chèvre garde sa fiche, son statut devient « abattoir » à la date donnée, et son bon de livraison est tenu à jour. */
export async function envoyerALAbattoir(animal: Chevre, date: string): Promise<void> {
  const boucle = (animal.numeroBoucle ?? '').trim();
  await declarerStatutChevre(animal.id, STATUT_CHEVRE.ABATTOIR, date);
  const reglages = await getSettings();
  const lots = lotsApresEnvoiAbattoir(reglages.exploitation?.lots ?? [], boucle, date);
  await updateSettings({ exploitation: { ...reglages.exploitation, lots } });
  await noterAEnvoyer();
}

/** Annule un envoi à l'abattoir enregistré par erreur : la chèvre redevient vivante et sort du bon du jour. */
export async function annulerEnvoiALAbattoir(animal: Chevre, date: string): Promise<void> {
  const boucle = (animal.numeroBoucle ?? '').trim();
  await reactiverChevre(animal.id);
  const reglages = await getSettings();
  const lots = lotsApresAnnulationAbattoir(reglages.exploitation?.lots ?? [], boucle, date);
  await updateSettings({ exploitation: { ...reglages.exploitation, lots } });
  await noterAEnvoyer(-1);
}
