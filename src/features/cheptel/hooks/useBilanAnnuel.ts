import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { calculerBilan, type Bilan } from '@/features/cheptel/services/bilanCheptel';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

/** Bilan de l'année active, celui de l'année précédente (pour comparaison) et les années disponibles. */
export function useBilanAnnuel() {
  const { settings, setAnneeActive } = useAppSettings();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const annee = settings.anneeActive;

  const [annees, setAnnees] = useState<number[]>([annee]);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [bilanPrecedent, setBilanPrecedent] = useState<Bilan | null>(null);

  const charger = useCallback(async () => {
    const [b, bPrec, toutesAnnees] = await Promise.all([
      calculerBilan(annee),
      calculerBilan(annee - 1),
      toutesLesAnneesConnues(),
    ]);
    setBilan(b);
    setBilanPrecedent(bPrec);
    setAnnees(toutesAnnees);
    // L'espèce n'est pas lue dans le chargement : elle sert à le relancer quand elle change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee, espece]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee, annees, setAnneeActive, bilan, bilanPrecedent };
}
