import { useEffect, useState } from 'react';
import { bouclesDeLInventaire, trierBoucles } from '@/features/stock/services/boucles';
import type { BoucleStock } from '@/features/stock/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ETAT_BOUCLE, SORTE_BOUCLES_TOUTES, TRI_BOUCLE } from '@/shared/constants/stock';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { loadAllYears } from '@/shared/storage/localStore';

/**
 * Ce que l'on voit de la liste des boucles : le filtre de la sorte (boucles, boucles rouges, ou toutes, sauf si l'écran n'en montre
 * qu'une) et celui de l'état (posées, à poser, toutes), le tri choisi, et les lignes qui en résultent. L'écran des contrôles s'en
 * sert aussi pour imprimer exactement ce qui est affiché.
 */
export function useListeBoucles(boucles: BoucleStock[], article?: string) {
  const [etat, setEtat] = useState<ValeurDe<typeof ETAT_BOUCLE>>(ETAT_BOUCLE.TOUT);
  const [choixSorte, setSorte] = useState<string>(SORTE_BOUCLES_TOUTES);
  const [tri, setTri] = useState<ValeurDe<typeof TRI_BOUCLE>>(TRI_BOUCLE.NUMERO);
  const [croissant, setCroissant] = useState(true);
  /** Les animaux qui ne sont plus vivants (morts, vendus, à l'abattoir…) : la case « Morte » d'une boucle est cochée quand l'animal qui la porte en fait partie. */
  const [morts, setMorts] = useState<Set<string>>(new Set());
  useEffect(() => {
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then((animaux) =>
      setMorts(new Set(animaux.filter((a) => a.statut !== STATUT_CHEVRE.VIVANTE).map((a) => a.id))),
    );
  }, [boucles]);

  const sorte = article ?? choixSorte;
  const lignes = trierBoucles(
    bouclesDeLInventaire({ boucles }, etat, sorte === SORTE_BOUCLES_TOUTES ? undefined : sorte),
    tri,
    croissant,
  );

  const trierPar = (colonne: ValeurDe<typeof TRI_BOUCLE>) => {
    if (colonne === tri) setCroissant(!croissant);
    else {
      setTri(colonne);
      setCroissant(true);
    }
  };

  return {
    etat,
    setEtat,
    sorte,
    setSorte,
    /** Vrai quand la sorte se choisit (l'écran des contrôles) ; faux quand elle est fixée (le détail d'un article de l'inventaire). */
    sorteChoisie: article === undefined,
    tri,
    croissant,
    trierPar,
    morts,
    lignes,
  };
}

export type ListeBoucles = ReturnType<typeof useListeBoucles>;
