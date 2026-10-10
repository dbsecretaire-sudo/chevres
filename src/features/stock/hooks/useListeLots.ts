import { useState } from 'react';
import { lotsDeLInventaire, trierLots } from '@/features/stock/services/lots';
import type { LotFromage } from '@/features/stock/types';
import { ETAT_LOT, TRI_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Ce que l'on voit de la liste des lots d'un fromage : le filtre d'état (tous, en stock, vendus, rappelés), le tri choisi et les lignes qui en résultent. */
export function useListeLots(lots: LotFromage[], article?: string) {
  const [etat, setEtat] = useState<ValeurDe<typeof ETAT_LOT>>(ETAT_LOT.TOUT);
  const [tri, setTri] = useState<ValeurDe<typeof TRI_LOT>>(TRI_LOT.NUMERO);
  const [croissant, setCroissant] = useState(true);

  const lignes = trierLots(lotsDeLInventaire({ lots }, etat, article), tri, croissant);

  const trierPar = (colonne: ValeurDe<typeof TRI_LOT>) => {
    if (colonne === tri) setCroissant(!croissant);
    else {
      setTri(colonne);
      setCroissant(true);
    }
  };

  return { etat, setEtat, tri, croissant, trierPar, lignes };
}

export type ListeLots = ReturnType<typeof useListeLots>;
