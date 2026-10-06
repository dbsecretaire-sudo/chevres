import { enregistrerFacture } from '@/features/comptabilite/repository/factures';
import type { Boisson } from '@/features/bar/types';
import { getSettings } from '@/features/settings/settings';
import {
  CATEGORIE_RECETTE,
  TAUX_TVA_RECETTE_ENTREPRISE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { TEXTES } from '@/shared/textes';

/** Une ligne de vente : une boisson et le nombre vendu. */
export interface LigneVenteBar {
  boisson: Boisson;
  quantite: number;
}

/** Le montant d'une vente de boissons : la somme des prix × quantités, au centime. */
export const totalVenteBar = (lignes: LigneVenteBar[]): number =>
  Math.round(lignes.reduce((total, l) => total + l.boisson.prix * l.quantite, 0) * 100) / 100;

/**
 * Enregistre une vente de boissons : une recette « Bar » du total (avec la TVA du bar si l'entreprise y est assujettie),
 * qui détaille les boissons vendues. Le stock, lui, a déjà baissé quand chaque boisson a été ajoutée au ticket. Renvoie le total.
 */
export async function enregistrerVenteBar(
  lignes: LigneVenteBar[],
  date: string,
  nomTicket?: string,
): Promise<number> {
  const vendues = lignes.filter((l) => l.quantite > 0);
  const total = totalVenteBar(vendues);
  const settings = await getSettings();
  await enregistrerFacture({
    activite: ACTIVITE_COMMUNE,
    date,
    type: TYPE_FACTURE.EMISE,
    tiers: TEXTES.bar.bar.tiers,
    description: TEXTES.bar.bar.descriptionVente(
      vendues.map((l) => TEXTES.bar.bar.ligneVente(l.quantite, l.boisson.nom)),
      nomTicket,
    ),
    montant: total,
    categorieRecette: CATEGORIE_RECETTE.BAR,
    tauxTva: settings.exploitation?.entreprise?.tvaApplicable
      ? TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.BAR]
      : undefined,
  });
  return total;
}
