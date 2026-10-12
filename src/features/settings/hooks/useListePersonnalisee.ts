import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { CLE_LISTE_PERSONNALISEE } from '@/shared/constants/controles';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/**
 * Une liste de valeurs que l'utilisateur tient (motifs de visite, codes de culture) : celle des réglages de l'établissement, ou la
 * liste d'origine. Rend la liste et la fonction qui l'enregistre.
 */
export function useListePersonnalisee(
  cle: ValeurDe<typeof CLE_LISTE_PERSONNALISEE>,
  parDefaut: readonly string[],
): [string[], (valeurs: string[]) => void] {
  const { settings, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const enregistrer = (valeurs: string[]) =>
    patchSettings({ exploitation: { ...infos, listes: { ...infos?.listes, [cle]: valeurs } } });
  return [infos?.listes?.[cle] ?? [...parDefaut], enregistrer];
}
