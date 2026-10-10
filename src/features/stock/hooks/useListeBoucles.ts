import { useEffect, useState } from 'react';
import { bouclesDeLInventaire, trierBoucles } from '@/features/stock/services/boucles';
import type { BoucleStock } from '@/features/stock/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ARTICLE_BOUCLE, ETAT_BOUCLE, GENRE_ARTICLE, TRI_BOUCLE } from '@/shared/constants/stock';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { loadAllYears } from '@/shared/storage/localStore';

/**
 * Ce que l'on voit de la liste des boucles d'une sorte (boucles, boucles rouges ou tiptag) : le filtre de l'état (posées, à poser,
 * toutes), le tri choisi, et les lignes qui en résultent. L'écran des contrôles s'en sert aussi pour imprimer exactement ce qui est
 * affiché.
 */
export function useListeBoucles(boucles: BoucleStock[], article: string | undefined) {
  const [etat, setEtat] = useState<ValeurDe<typeof ETAT_BOUCLE>>(ETAT_BOUCLE.TOUT);
  const [tri, setTri] = useState<ValeurDe<typeof TRI_BOUCLE>>(TRI_BOUCLE.NUMERO);
  const [croissant, setCroissant] = useState(true);
  /** Les animaux qui ne sont plus vivants (morts, vendus, à l'abattoir…) : la case « Morte » d'une boucle est cochée quand l'animal qui la porte en fait partie. */
  const [morts, setMorts] = useState<Set<string>>(new Set());
  useEffect(() => {
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then((animaux) =>
      setMorts(new Set(animaux.filter((a) => a.statut !== STATUT_CHEVRE.VIVANTE).map((a) => a.id))),
    );
  }, [boucles]);

  const lignes = trierBoucles(bouclesDeLInventaire({ boucles }, etat, article), tri, croissant);

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
    /** La sorte de boucles montrée (son article de l'inventaire). */
    article,
    tri,
    croissant,
    trierPar,
    morts,
    lignes,
  };
}

export type ListeBoucles = ReturnType<typeof useListeBoucles>;

/** Les trois listes de boucles du contrôle des animaux (boucles, boucles rouges, tiptag), chacune avec son état et son tri. */
export function useListesBoucles(boucles: BoucleStock[]): ListeBoucles[] {
  const cle = (code: ValeurDe<typeof ARTICLE_BOUCLE>) => `${GENRE_ARTICLE.BOUCLE}:${code}`;
  const normales = useListeBoucles(boucles, cle(ARTICLE_BOUCLE.BOUCLES));
  const rouges = useListeBoucles(boucles, cle(ARTICLE_BOUCLE.ROUGES));
  const tiptag = useListeBoucles(boucles, cle(ARTICLE_BOUCLE.TIPTAG));
  return [normales, rouges, tiptag];
}
