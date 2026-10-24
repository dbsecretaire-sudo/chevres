import { TAUX_TVA_DISPONIBLES } from '@/shared/constants/comptabilite';

/** La TVA comprise dans un montant TTC au taux donné (en %) ; 0 sans taux. */
export const tvaDuTtc = (ttc: number, taux?: number): number => (taux ? ttc - ttc / (1 + taux / 100) : 0);

/** Libellé d'un taux de TVA (ex : 2.1 → « 2,1 % »). */
export const libelleTauxTva = (taux: number) => `${String(taux).replace('.', ',')} %`;

/** Options de la liste déroulante « Taux de TVA » (la valeur est le taux en texte, ex : « 2.1 »). */
export const OPTIONS_TAUX_TVA = TAUX_TVA_DISPONIBLES.map((taux) => ({
  value: String(taux),
  label: libelleTauxTva(taux),
}));
