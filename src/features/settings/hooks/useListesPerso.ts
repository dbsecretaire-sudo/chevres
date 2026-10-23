import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { CleListePerso } from '@/features/settings/services/listesDeChoix';
import type { ListePerso } from '@/features/settings/services/listesPerso';

/** Les listes de choix personnalisées de l'établissement, et de quoi les changer (une fonction reçoit la liste et rend la nouvelle). */
export function useListesPerso() {
  const { settings, patchSettings } = useAppSettings();
  const listes = settings.exploitation?.listesPerso ?? {};
  const changer = (cle: CleListePerso, suite: (liste: ListePerso | undefined) => ListePerso) =>
    patchSettings({ exploitation: { ...settings.exploitation, listesPerso: { ...listes, [cle]: suite(listes[cle]) } } });
  return { listes, changer };
}
