import { enregistrerFacture } from '@/features/comptabilite/repository/factures';
import { totalTicket, type LigneVenteAnnexe } from '@/features/annexes/services/tickets';
import type { ActiviteAnnexe } from '@/features/annexes/types';
import { getSettings } from '@/features/settings/settings';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { NATURE_URSSAF_DES_ACTIVITES_ANNEXES } from '@/shared/constants/entreprise';
import { TEXTES } from '@/shared/textes';

/**
 * Enregistre la vente d'un ticket d'une activité annexe : une recette du total, inscrite au compte choisi pour l'activité
 * (avec sa TVA si l'entreprise y est assujettie), qui détaille les articles vendus. Le stock, lui, a déjà baissé quand
 * chaque article a été ajouté au ticket. Renvoie le total.
 */
export async function enregistrerVenteAnnexe(
  activite: ActiviteAnnexe,
  lignes: LigneVenteAnnexe[],
  date: string,
  nomTicket?: string,
  /** La TVA du ticket (%) ; absente : celle de l'activité. */
  tauxTva?: number,
): Promise<number> {
  const vendues = lignes.filter((l) => l.quantite > 0);
  const total = totalTicket(vendues);
  const settings = await getSettings();
  await enregistrerFacture({
    activite: ACTIVITE_COMMUNE,
    date,
    type: TYPE_FACTURE.EMISE,
    tiers: TEXTES.annexes.vente.tiers(activite.nom),
    description: TEXTES.annexes.vente.description(
      vendues.map((l) => TEXTES.annexes.vente.ligne(l.quantite, l.article.nom)),
      nomTicket,
    ),
    montant: total,
    categorieRecette: CATEGORIE_RECETTE.AUTRE,
    compteManuel: activite.compte,
    natureUrssaf: activite.natureUrssaf ?? NATURE_URSSAF_DES_ACTIVITES_ANNEXES,
    tauxTva: settings.exploitation?.entreprise?.tvaApplicable ? (tauxTva ?? activite.tauxTva) : undefined,
  });
  return total;
}
