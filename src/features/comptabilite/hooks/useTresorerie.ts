import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { tresorerie, type Tresorerie } from '@/features/comptabilite/services/tresorerie';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

/** La trésorerie de l'année active, rechargée à chaque retour sur l'écran. */
export function useTresorerie() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [resultat, setResultat] = useState<Tresorerie | null>(null);
  const annee = settings.anneeActive;
  const reglages = settings.exploitation?.tresorerie;
  const emprunts = settings.exploitation?.emprunts;
  // Les contrats d'assurance n'entrent dans l'échéancier que lorsqu'il est activé.
  const contratsAssurance = settings.exploitation?.echeancierAssurance ? settings.exploitation?.contratsAssurance : undefined;

  const charger = useCallback(async () => {
    const [toutesAnnees, t] = await Promise.all([
      toutesLesAnneesConnues(),
      tresorerie(annee, { reglages, emprunts, contratsAssurance }),
    ]);
    setAnnees(toutesAnnees);
    setResultat(t);
  }, [annee, reglages, emprunts, contratsAssurance]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee, annees, setAnneeActive, resultat };
}
