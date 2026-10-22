import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { calculerStatsAccueil, type StatsAccueil } from '@/features/accueil/services/statsAccueil';
import { calculerBilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { surChangement } from '@/shared/storage/localStore';

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

  // Une écriture (vente ou facture), même indirecte (une visite réalisée, un lot, une synchronisation), met les chiffres à jour tout de suite : le bandeau
  // du bas reste en place d'une page à l'autre, il ne se relit pas à chaque retour sur un écran.
  useEffect(() => {
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const arreter = surChangement((categorie) => {
      if (categorie !== CATEGORIE_STOCKAGE.FACTURES && categorie !== CATEGORIE_STOCKAGE.VENTES) return;
      // Plusieurs écritures d'affilée ne relancent qu'un seul calcul.
      clearTimeout(minuteur);
      minuteur = setTimeout(() => {
        charger().catch(() => undefined);
      }, 150);
    });
    return () => {
      clearTimeout(minuteur);
      arreter();
    };
  }, [charger]);

  return { annee: settings.anneeActive, annees, setAnneeActive, stats };
}
