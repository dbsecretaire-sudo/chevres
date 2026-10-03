import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { calculerStatsAccueil, type StatsAccueil } from '@/features/accueil/services/statsAccueil';
import { calculerBilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import { listVisitesVeterinaire } from '@/features/exploitation/repository/visitesVeterinaire';

/** Statistiques de l'écran d'accueil pour l'année active, rechargées à chaque retour sur l'écran. */
export function useAccueil() {
  const { settings } = useAppSettings();
  const [stats, setStats] = useState<StatsAccueil | null>(null);

  const charger = useCallback(async () => {
    const annee = settings.anneeActive;
    const [vivantes, ventes, factures, visites, alimentation] = await Promise.all([
      listChevresVivantes(),
      listVentes(annee),
      listFactures(annee),
      listVisitesVeterinaire(annee),
      calculerBilanAlimentation(annee),
    ]);
    setStats(calculerStatsAccueil({ annee, vivantes, ventes, factures, visites, alimentation }));
  }, [settings.anneeActive]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee: settings.anneeActive, stats };
}
