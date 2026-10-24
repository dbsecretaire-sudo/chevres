import type { VisiteVeterinaire } from '@/features/sante/types';

/** Combien de jours avant son échéance un bilan sanitaire est dit « bientôt expiré ». */
export const JOURS_BILAN_BIENTOT = 60;

/** Vrai pour une visite qui est un bilan sanitaire (son motif le dit : « Bilan sanitaire annuel », « bilan sanitaire d'élevage »…). */
export const estBilanSanitaire = (visite: Pick<VisiteVeterinaire, 'motif'>): boolean =>
  /bilan\s+sanitaire/i.test(visite.motif ?? '');

export type EtatDuBilan = 'aucun' | 'valide' | 'bientot' | 'expire';

export interface BilanSanitaire {
  etat: EtatDuBilan;
  /** La date du dernier bilan (AAAA-MM-JJ). */
  dernier?: string;
  /** La date où il expire : un an après (AAAA-MM-JJ). */
  echeance?: string;
  /** Les jours restants avant l'échéance (négatif : expiré depuis ce nombre de jours). */
  jours?: number;
}

const unAnApres = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
};

const joursEntre = (de: string, a: string): number =>
  Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${de}T00:00:00Z`).getTime()) / 86_400_000);

/**
 * L'état du bilan sanitaire annuel d'après les visites du vétérinaire : le dernier bilan fait (jusqu'à aujourd'hui) vaut un an. Valide,
 * bientôt expiré (dans les 60 jours), expiré, ou aucun bilan enregistré.
 */
export function etatDuBilan(
  visites: Pick<VisiteVeterinaire, 'date' | 'motif'>[],
  aujourdhui: string,
  joursAvant: number = JOURS_BILAN_BIENTOT,
): BilanSanitaire {
  const dernier = visites
    .filter((v) => estBilanSanitaire(v) && v.date <= aujourdhui)
    .map((v) => v.date)
    .sort()
    .pop();
  if (!dernier) return { etat: 'aucun' };
  const echeance = unAnApres(dernier);
  const jours = joursEntre(aujourdhui, echeance);
  return { etat: jours < 0 ? 'expire' : jours <= joursAvant ? 'bientot' : 'valide', dernier, echeance, jours };
}
