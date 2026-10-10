import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { calculerStatsAccueil, type StatsAccueil } from '@/features/accueil/services/statsAccueil';
import { calculerBilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

/** Statistiques de l'écran d'accueil pour l'année active, rechargées à chaque retour sur l'écran. */
export function useAccueil() {
  const { settings, setAnneeActive } = useAppSettings();
  // L'espèce active : les chiffres se rechargent quand elle change, sans que l'écran soit recréé.
  const { espece } = useEtablissement();
  const [stats, setStats] = useState<StatsAccueil | null>(null);
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);

  const charger = useCallback(async () => {
    const annee = settings.anneeActive;
    const [toutesAnnees, vivantes, ventes, factures, alimentation] = await Promise.all([
      toutesLesAnneesConnues(),
      listChevresVivantes(),
      listVentes(annee),
      listFactures(annee),
      calculerBilanAlimentation(annee),
    ]);
    setAnnees(toutesAnnees);
    setStats(calculerStatsAccueil({ annee, vivantes, ventes, factures, alimentation }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.anneeActive, espece]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee: settings.anneeActive, annees, setAnneeActive, stats };
}
