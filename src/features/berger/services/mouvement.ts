import type { Chevre } from '@/features/cheptel/types';
import { declarerStatutChevre, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';

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
