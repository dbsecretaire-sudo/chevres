import { TAUX_TVA_DISPONIBLES } from '@/shared/constants/comptabilite';

/** Libellé d'un taux de TVA (ex : 2.1 → « 2,1 % »). */
export const libelleTauxTva = (taux: number) => `${String(taux).replace('.', ',')} %`;

/** Options de la liste déroulante « Taux de TVA » (la valeur est le taux en texte, ex : « 2.1 »). */
export const OPTIONS_TAUX_TVA = TAUX_TVA_DISPONIBLES.map((taux) => ({
  value: String(taux),
  label: libelleTauxTva(taux),
}));
