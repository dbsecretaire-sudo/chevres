import { TAUX_TVA_DISPONIBLES } from '@/shared/constants/comptabilite';

/** La TVA comprise dans un montant TTC au taux donné (en %) ; 0 sans taux. */
export const tvaDuTtc = (ttc: number, taux?: number): number => (taux ? ttc - ttc / (1 + taux / 100) : 0);

/**
 * Le taux commun à des lignes d'achat : celui de toutes, ou rien quand elles en ont plusieurs (la TVA se lit alors ligne par ligne).
 */
export function tauxCommun(lignes: { tauxTva?: number }[]): number | undefined {
  const taux = new Set(lignes.map((l) => l.tauxTva));
  return taux.size === 1 ? [...taux][0] : undefined;
}

/**
 * La TVA d'une facture, taux par taux : chaque ligne d'achat compte à son taux (à défaut, celui de la facture) ; une facture sans
 * lignes compte d'un seul bloc à son taux. Sans taux, rien n'est déductible.
 */
export function ventilationTva(f: {
  montant: number;
  tauxTva?: number;
  lignesAlimentation?: { montant: number; tauxTva?: number }[];
}): { taux: number; ttc: number }[] {
  if (!f.lignesAlimentation || f.lignesAlimentation.length === 0) {
    return f.tauxTva ? [{ taux: f.tauxTva, ttc: f.montant }] : [];
  }
  const parTaux = new Map<number, number>();
  for (const ligne of f.lignesAlimentation) {
    const taux = ligne.tauxTva ?? f.tauxTva;
    if (taux) parTaux.set(taux, (parTaux.get(taux) ?? 0) + ligne.montant);
  }
  return [...parTaux].map(([taux, ttc]) => ({ taux, ttc }));
}

/** Libellé d'un taux de TVA (ex : 2.1 → « 2,1 % »). */
export const libelleTauxTva = (taux: number) => `${String(taux).replace('.', ',')} %`;

/** Options de la liste déroulante « Taux de TVA » (la valeur est le taux en texte, ex : « 2.1 »). */
export const OPTIONS_TAUX_TVA = TAUX_TVA_DISPONIBLES.map((taux) => ({
  value: String(taux),
  label: libelleTauxTva(taux),
}));
