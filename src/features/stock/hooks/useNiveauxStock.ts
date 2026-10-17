import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { effectifsVivants } from '@/features/cheptel/repository/chevres';
import { lireArchiveStock } from '@/features/stock/repository';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { numerosTiptag } from '@/features/stock/services/boucles';
import { niveauxDeStock } from '@/features/stock/services/stock';

/**
 * Le niveau de chaque article du stock (par identifiant « genre:code »), relu à chaque retour sur l'écran. L'animal sur pied
 * et l'animal vivant valent le nombre d'animaux vivants du cheptel.
 */
export function useNiveauxStock(): Map<string, number> {
  const [niveaux, setNiveaux] = useState<Map<string, number>>(new Map());

  useFocusEffect(
    useCallback(() => {
      Promise.all([lireArchiveStock(), listToutesVentes()])
        .then(async ([archive, ventes]) =>
          setNiveaux(
            niveauxDeStock(
              archive.mouvements,
              await effectifsVivants(
                new Set(ventes.flatMap((v) => idsDesAnimaux(v))),
                numerosTiptag(archive.boucles),
              ),
            ),
          ),
        )
        .catch(() => undefined);
    }, []),
  );

  return niveaux;
}
