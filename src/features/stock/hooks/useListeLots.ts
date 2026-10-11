import { useState } from 'react';
import { etatDuLot, lotsDeLInventaire, trierLots } from '@/features/stock/services/lots';
import { useFiltresColonnes } from '@/shared/hooks/useFiltresColonnes';
import { formatDateShortFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';
import type { LotFromage } from '@/features/stock/types';
import { ETAT_LOT, TRI_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Ce que l'on voit de la liste des lots d'un fromage : le filtre d'état (tous, en stock, vendus, rappelés), le tri choisi et les lignes qui en résultent. */
export function useListeLots(lots: LotFromage[], article?: string) {
  const [etat, setEtat] = useState<ValeurDe<typeof ETAT_LOT>>(ETAT_LOT.TOUT);
  const [tri, setTri] = useState<ValeurDe<typeof TRI_LOT>>(TRI_LOT.NUMERO);
  const [croissant, setCroissant] = useState(true);

  const triees = trierLots(lotsDeLInventaire({ lots }, etat, article), tri, croissant);
  /** Le filtre de chaque colonne, comme dans Excel : les valeurs sont celles qu'affiche le tableau. */
  const filtres = useFiltresColonnes<LotFromage, 'numero' | 'fabrication' | 'vente' | 'controle'>({
    numero: (l) => l.numero,
    fabrication: (l) => formatDateShortFR(l.dateFabrication),
    vente: (l) =>
      etatDuLot(l) === ETAT_LOT.RAPPELE
        ? TEXTES.stock.lots.rappele
        : l.dateVente
          ? formatDateShortFR(l.dateVente)
          : '',
    controle: (l) => (l.controleOk ? TEXTES.stock.lots.controleOui : TEXTES.stock.lots.controleNon),
  });
  const lignes = filtres.filtrer(triees);

  const trierPar = (colonne: ValeurDe<typeof TRI_LOT>) => {
    if (colonne === tri) setCroissant(!croissant);
    else {
      setTri(colonne);
      setCroissant(true);
    }
  };

  /** Trie d'après une colonne dans le sens voulu (le menu d'une colonne : tri croissant, tri décroissant). */
  const trierEn = (colonne: ValeurDe<typeof TRI_LOT>, sensCroissant: boolean) => {
    setTri(colonne);
    setCroissant(sensCroissant);
  };

  return {
    etat,
    setEtat,
    tri,
    croissant,
    trierPar,
    trierEn,
    filtres,
    /** Les valeurs d'une colonne pour son filtre : celles de tous les lots de l'état choisi. */
    valeursDeLaColonne: (colonne: 'numero' | 'fabrication' | 'vente' | 'controle') =>
      filtres.valeurs(triees, colonne),
    lignes,
  };
}

export type ListeLots = ReturnType<typeof useListeLots>;
