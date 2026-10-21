import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import {
  documentsManquantsToutesAnnees,
  ecrituresACirculation,
  type EcritureACirculation,
} from '@/features/comptabilite/services/documentsCirculation';
import { nomsDesAbattoirs } from '@/features/fournisseurs/services/abattoirs';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';

/**
 * Les documents de circulation qui manquent pour l'espèce choisie (ventes et dépenses d'animaux vivants, de toutes les années, dont le
 * document n'est pas déposé), relus à chaque retour sur l'écran : de quoi rappeler à l'accueil de les déposer.
 */
export function useDocumentsCirculationManquants(): EcritureACirculation[] {
  const { espece } = useEtablissement();
  const lots = useAppSettings().settings.exploitation?.lots;
  const [manquants, setManquants] = useState<EcritureACirculation[]>([]);
  useFocusEffect(
    useCallback(() => {
      Promise.all([listToutesVentes(), listToutesFactures(), nomsDesAbattoirs()])
        .then(([ventes, factures, abattoirs]) =>
          setManquants(
            documentsManquantsToutesAnnees(ecrituresACirculation(ventes, factures, abattoirs, lots)).filter(
              (e) => e.activite === espece || e.activite === ACTIVITE_COMMUNE,
            ),
          ),
        )
        .catch(() => undefined);
    }, [espece, lots]),
  );
  return manquants;
}
