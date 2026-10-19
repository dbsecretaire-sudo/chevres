import { getSettings } from '@/features/settings/settings';

/** Dans l'adresse d'une étape : le lot d'abattoir le plus récent (même sans animal), pour montrer une fiche de lot. */
export const LOT_ABATTOIR = '{lotAbattoir}';

/**
 * L'adresse réelle d'une étape : celle dont l'identifiant dépend des données (un lot d'abattoir) est remplacée par celui de l'établissement
 * actif ; sans lot, la fiche s'ouvre vierge.
 */
export async function adresseReelle(adresse: string): Promise<string> {
  if (!adresse.includes(LOT_ABATTOIR)) return adresse;
  const lots = (await getSettings()).exploitation?.lots ?? [];
  const recent = lots.filter((l) => l.abattoir).sort((a, b) => (b.abattoir ?? '').localeCompare(a.abattoir ?? ''))[0];
  // Sans lot, la fiche s'ouvre vierge (sans identifiant) : l'écran reste celui de l'étape.
  return recent ? adresse.replace(LOT_ABATTOIR, recent.id) : adresse.replace(`id=${LOT_ABATTOIR}&`, '');
}
