import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { ecrituresACirculation, type EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import { nomsDesAbattoirs } from '@/features/fournisseurs/services/abattoirs';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { rappelsEnvoiCirculation } from '@/features/rappels/services/rappelsCirculation';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { todayISO } from '@/shared/utils/dates';

/**
 * Les envois à la chambre d'agriculture des documents de circulation (espèce choisie) qui restent à valider, relus à chaque retour
 * sur l'écran. `valides` : les rappels déjà validés (ceux de l'historique).
 */
export function useRappelsCirculation(valides: readonly string[]) {
  const { espece } = useEtablissement();
  const lots = useAppSettings().settings.exploitation?.lots;
  const [ecritures, setEcritures] = useState<EcritureACirculation[]>([]);
  useFocusEffect(
    useCallback(() => {
      Promise.all([listToutesVentes(), listToutesFactures(), nomsDesAbattoirs()])
        .then(([ventes, factures, abattoirs]) =>
          setEcritures(
            ecrituresACirculation(ventes, factures, abattoirs, lots).filter(
              (e) => e.activite === espece || e.activite === ACTIVITE_COMMUNE,
            ),
          ),
        )
        .catch(() => undefined);
    }, [espece, lots]),
  );
  return useMemo(() => rappelsEnvoiCirculation(ecritures, valides, todayISO()), [ecritures, valides]);
}
