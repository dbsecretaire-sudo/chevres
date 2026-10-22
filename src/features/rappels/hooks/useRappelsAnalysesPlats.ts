import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { rappelsAnalysesPlats } from '@/features/stock/services/analysesPlats';
import { enregistrerAnalyseDePlats } from '@/features/stock/services/lots';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { todayISO } from '@/shared/utils/dates';

/**
 * Les échantillons de plats préparés à envoyer à un laboratoire d'analyses, relus à chaque retour sur l'écran : une ligne par fabrication dont il reste des
 * lots en stock, à l'intervalle réglé dans la liste des plats. `valider` note l'envoi du jour : l'analyse suivante se compte à partir de lui.
 */
export function useRappelsAnalysesPlats() {
  const jours = useAppSettings().settings.exploitation?.joursEntreAnalysesPlats;
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const charger = useCallback(
    () =>
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );
  const rappels = useMemo(
    () => (archive ? rappelsAnalysesPlats(archive, jours, todayISO()) : []),
    [archive, jours],
  );
  const valider = async (fabricationId: string) => {
    await enregistrerAnalyseDePlats(fabricationId, todayISO());
    await charger();
  };
  return { rappels, valider };
}
