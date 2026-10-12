import {
  TAUX_TVA_VENTE_PAR_CATEGORIE,
  TYPE_AIDE,
  type CATEGORIE_VENTE,
} from '@/shared/constants/comptabilite';
import { TAUX_IMPOSITION_TYPE_AIDE } from '@/shared/constants/planComptable';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Un type d'aide qui a un taux d'imposition d'office (tous sauf « autre », dont le taux se saisit à chaque fois). */
export type TypeAideAvecTaux = Exclude<ValeurDe<typeof TYPE_AIDE>, typeof TYPE_AIDE.AUTRE>;

/**
 * Les taux que l'utilisateur a réglés par produit (Comptabilité › Réglages › Taux par produit) : le taux de TVA proposé pour chaque
 * vente de production, et le taux d'imposition proposé pour chaque type d'aide. Ce qui n'y est pas réglé garde le taux d'office.
 */
export interface TauxParProduit {
  tva?: Partial<Record<ValeurDe<typeof CATEGORIE_VENTE>, number>>;
  imposition?: Partial<Record<TypeAideAvecTaux, number>>;
}

let reglages: TauxParProduit = {};

/** Pose les taux de l'établissement (à chaque lecture ou écriture des réglages). */
export const definirTauxParProduit = (taux?: TauxParProduit): void => {
  reglages = taux ?? {};
};

/** Le taux de TVA proposé pour une vente de cette catégorie : celui des réglages, à défaut celui d'office. */
export const tauxTvaDeLaVente = (categorie: ValeurDe<typeof CATEGORIE_VENTE>): number =>
  reglages.tva?.[categorie] ?? TAUX_TVA_VENTE_PAR_CATEGORIE[categorie];

/** Le taux d'imposition proposé pour une aide de ce type : celui des réglages, à défaut celui d'office. */
export const tauxImpositionDeLAide = (type: TypeAideAvecTaux): number =>
  reglages.imposition?.[type] ?? TAUX_IMPOSITION_TYPE_AIDE[type];
