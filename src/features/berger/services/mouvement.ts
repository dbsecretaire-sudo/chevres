import type { Chevre } from '@/features/cheptel/types';
import { declarerStatutChevre, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { annulerUneMort, enregistrerUneMort } from '@/features/berger/services/saisies';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';

/**
 * Une sortie sans vente ni facture, c'est une mort : même enregistrement que le décès. Rend la fiche d'avant, pour pouvoir annuler.
 */
export async function enregistrerSortieSansVente(animal: Chevre, date: string): Promise<Chevre> {
  const avant = await enregistrerUneMort(animal, date);
  await noterAEnvoyer();
  return avant;
}

/** Annule une sortie sans vente enregistrée par erreur. */
export async function annulerSortieSansVente(avant: Chevre): Promise<void> {
  await annulerUneMort(avant);
  await noterAEnvoyer(-1);
}

/** L'envoi à l'abattoir : la chèvre garde sa fiche, son statut devient « abattoir » à la date donnée. */
export async function envoyerALAbattoir(animal: Chevre, date: string): Promise<void> {
  await declarerStatutChevre(animal.id, STATUT_CHEVRE.ABATTOIR, date);
  await noterAEnvoyer();
}

/** Annule un envoi à l'abattoir enregistré par erreur : la chèvre redevient vivante. */
export async function annulerEnvoiALAbattoir(animal: Chevre): Promise<void> {
  await reactiverChevre(animal.id);
  await noterAEnvoyer(-1);
}
