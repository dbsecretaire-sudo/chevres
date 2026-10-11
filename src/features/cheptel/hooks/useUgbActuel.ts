import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { effectifsVivants } from '@/features/cheptel/repository/chevres';
import { coefficientsUgb, ugbDe } from '@/features/cheptel/services/ugb';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';

/** L'UGB actuel de l'exploitation : les animaux vivants de chaque espèce avec les coefficients des réglages (rien avant le chargement). */
export function useUgbActuel(): number | undefined {
  const { settings } = useAppSettings();
  const infos = settings.exploitation;
  const [ugb, setUgb] = useState<number | undefined>();
  useFocusEffect(
    useCallback(() => {
      effectifsVivants().then((effectifs) =>
        setUgb(
          Object.entries(effectifs).reduce(
            (total, [espece, effectif]) =>
              total +
              ugbDe(effectif ?? { petits: 0, sevres: 0 }, coefficientsUgb(infos, espece as EspeceAnimale)),
            0,
          ),
        ),
      );
    }, [infos]),
  );
  return ugb;
}
