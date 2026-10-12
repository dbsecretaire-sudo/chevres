import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { pilotageTva, type PilotageTva } from '@/features/comptabilite/services/pilotageTva';
import { reglagesTva } from '@/features/comptabilite/utils/reglagesTva';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

/** Le pilotage de la TVA de l'année active, rechargé à chaque retour sur l'écran. */
export function usePilotageTva() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [pilotage, setPilotage] = useState<PilotageTva | null>(null);
  const reglages = reglagesTva(settings.exploitation);
  const { regime, periodicite, tauxRfa } = reglages;

  const charger = useCallback(async () => {
    const [toutesAnnees, p] = await Promise.all([
      toutesLesAnneesConnues(),
      pilotageTva(settings.anneeActive, { regime, periodicite, tauxRfa }),
    ]);
    setAnnees(toutesAnnees);
    setPilotage(p);
  }, [settings.anneeActive, regime, periodicite, tauxRfa]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee: settings.anneeActive, annees, setAnneeActive, pilotage, reglages };
}
