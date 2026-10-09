import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { memeJourDansLAnnee, todayISO } from '@/shared/utils/dates';

/**
 * L'année qu'impose l'année active à la date d'une nouvelle écriture (recette, dépense, facture) : l'année active, sauf avec
 * « Tout », où l'année est libre. `dateDuJour` est aujourd'hui, dans cette année quand elle est imposée.
 */
export function useAnneeImposee(): { anneeImposee: number | undefined; dateDuJour: string } {
  const { settings } = useAppSettings();
  const anneeImposee = settings.toutesAnnees ? undefined : settings.anneeActive;
  return {
    anneeImposee,
    dateDuJour: anneeImposee ? memeJourDansLAnnee(todayISO(), anneeImposee) : todayISO(),
  };
}
