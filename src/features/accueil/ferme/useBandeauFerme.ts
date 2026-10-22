import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import { compterBouclesPosees } from '@/features/accueil/services/fermeAccueil';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useRappels } from '@/features/rappels/hooks/useRappels';
import { useRappelsAnalysesPlats } from '@/features/rappels/hooks/useRappelsAnalysesPlats';
import { useRappelsCirculation } from '@/features/rappels/hooks/useRappelsCirculation';
import { lireArchiveStock } from '@/features/stock/repository';
import { useLotsARappeler } from '@/features/stock/hooks/useLotsARappeler';
import { numerosTiptag } from '@/features/stock/services/boucles';

/**
 * Ce que le bandeau de la ferme montre : la balance de l'année, les boucles posées sur les animaux vivants (et les tiptag, le petit badge) et le
 * nombre de rappels à valider : les mêmes chiffres sur toutes les pages.
 */
export function useBandeauFerme(): {
  balance?: number;
  rappels: number;
  boucles?: { boucles: number; tiptag: number };
} {
  const accueil = useAccueil();
  const { espece } = useEtablissement();
  const { rappels, valides } = useRappels();
  const envois = useRappelsCirculation(valides);
  const { rappels: analyses } = useRappelsAnalysesPlats();
  const { aRappeler, aValider } = useLotsARappeler();
  const [boucles, setBoucles] = useState<{ boucles: number; tiptag: number } | undefined>();
  useFocusEffect(
    useCallback(() => {
      Promise.all([lireArchiveStock(), listChevresVivantes()])
        .then(([archive, vivants]) =>
          setBoucles(compterBouclesPosees(vivants, numerosTiptag(archive.boucles))),
        )
        .catch(() => undefined);
      // L'espèce change ce que les listes renvoient : on relit alors les boucles.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece]),
  );
  return {
    balance: accueil.stats?.soldeFactures,
    boucles,
    rappels: rappels.length + envois.length + analyses.length + (aRappeler > 0 ? 1 : 0) + aValider.length,
  };
}
