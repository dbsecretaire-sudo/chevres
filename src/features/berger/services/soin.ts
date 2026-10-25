import type { Chevre } from '@/features/cheptel/types';
import { enregistrerTraitement, supprimerTraitement } from '@/features/sante/repository/traitements';
import { noterAEnvoyer } from '@/shared/storage/aEnvoyer';
import { ajouterJours } from '@/shared/utils/calendrier';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

/** Les produits proposés pour un soin, dans l'ordre de l'écran. */
export const PRODUITS_SOIN = ['Vermifuge', 'Antibiotique', 'Vaccin', 'Autre'] as const;

/** Le délai d'attente proposé par défaut, en jours, avant que le lait puisse aller à la fromagerie. */
export const DELAI_LAIT_PAR_DEFAUT = 7;

/**
 * Le message du délai d'attente pour le lait : jusqu'à quelle date le lait ne va pas à la fromagerie, à partir de la dernière prise.
 * Rend undefined sans délai.
 */
export function messageDelaiLait(dateDernierePrise: string, delaiJours: number): string | undefined {
  if (delaiJours <= 0) return undefined;
  return `Pas de lait pour la fromagerie jusqu’au ${formatDateFR(ajouterJours(dateDernierePrise, delaiJours))}.`;
}

/** Enregistre un soin donné à une chèvre, et le compte dans les saisies à envoyer. Rend l'identifiant du traitement. */
export async function enregistrerSoin(
  animal: Pick<Chevre, 'numeroBoucle'>,
  saisie: { produit: string; date: string; delaiLaitJours: number },
): Promise<string> {
  const traitement = await enregistrerTraitement({
    date: saisie.date,
    dateFin: saisie.date,
    produit: saisie.produit,
    chevreNumeroBoucle: (animal.numeroBoucle ?? '').trim(),
    delaiLaitJours: saisie.delaiLaitJours > 0 ? saisie.delaiLaitJours : undefined,
  });
  await noterAEnvoyer();
  return traitement.id;
}

/** Annule un soin enregistré par erreur. */
export async function annulerSoin(traitementId: string): Promise<void> {
  await supprimerTraitement(traitementId);
  await noterAEnvoyer(-1);
}

/** La date du jour, pour pré-remplir le formulaire. */
export const dateDuJour = (): string => todayISO();
