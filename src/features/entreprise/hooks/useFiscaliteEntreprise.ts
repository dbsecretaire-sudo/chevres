import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import {
  calculerFiscaliteEntreprise,
  type FiscaliteEntreprise,
} from '@/features/entreprise/services/fiscaliteEntreprise';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

/** Chiffre d'affaires et TVA de l'année active, rechargés à chaque retour sur l'écran, avec les infos de l'entreprise. */
export function useFiscaliteEntreprise() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [fiscalite, setFiscalite] = useState<FiscaliteEntreprise | null>(null);

  const charger = useCallback(async () => {
    const [toutesAnnees, f] = await Promise.all([
      toutesLesAnneesConnues(),
      calculerFiscaliteEntreprise(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setFiscalite(f);
  }, [settings.anneeActive]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return {
    annee: settings.anneeActive,
    annees,
    setAnneeActive,
    fiscalite,
    infos: settings.exploitation?.entreprise,
  };
}
