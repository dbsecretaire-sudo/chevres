import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import {
  documentsManquants,
  ecrituresACirculation,
  type EcritureACirculation,
} from '@/features/comptabilite/services/documentsCirculation';
import { nomsDesAbattoirs } from '@/features/fournisseurs/services/abattoirs';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';

/**
 * Les documents de circulation qui manquent pour l'espèce choisie (ventes et dépenses d'animaux vivants des douze derniers mois dont le
 * document n'est pas déposé), relus à chaque retour sur l'écran : de quoi rappeler à l'accueil de les déposer.
 */
export function useDocumentsCirculationManquants(): EcritureACirculation[] {
  const { espece } = useEtablissement();
  const [manquants, setManquants] = useState<EcritureACirculation[]>([]);
  useFocusEffect(
    useCallback(() => {
      Promise.all([listToutesVentes(), listToutesFactures(), nomsDesAbattoirs()])
        .then(([ventes, factures, abattoirs]) =>
          setManquants(
            documentsManquants(ecrituresACirculation(ventes, factures, abattoirs)).filter(
              (e) => e.activite === espece || e.activite === ACTIVITE_COMMUNE,
            ),
          ),
        )
        .catch(() => undefined);
    }, [espece]),
  );
  return manquants;
}
