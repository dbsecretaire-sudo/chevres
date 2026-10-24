import { useCallback } from 'react';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { VenteDAnimauxVivants } from '@/features/settings/settings';

/** Les ventes d'animaux vivants de l'établissement, rangées dans les réglages (elles se sauvegardent avec eux). */
export function useVentesVivants() {
  const { settings, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const ventes = infos?.ventesVivants ?? [];

  /** Remplace la vente du même identifiant (l'autosave de sa fiche, le dépôt ou le retrait du document). */
  const modifier = useCallback(
    (vente: VenteDAnimauxVivants) =>
      patchSettings({
        exploitation: { ...infos, ventesVivants: (infos?.ventesVivants ?? []).map((v) => (v.id === vente.id ? vente : v)) },
      }),
    [infos, patchSettings],
  );

  const supprimer = useCallback(
    (id: string) => patchSettings({ exploitation: { ...infos, ventesVivants: (infos?.ventesVivants ?? []).filter((v) => v.id !== id) } }),
    [infos, patchSettings],
  );

  return { ventes, modifier, supprimer };
}
