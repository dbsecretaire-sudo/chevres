import { useEffect, useState } from 'react';
import type { Chevre } from '@/features/cheptel/types';
import {
  bouclesDeLInventaire,
  bouclesSelonLeCheptel,
  nePasPoser,
  trierBoucles,
} from '@/features/stock/services/boucles';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { synchroBouclesActive } from '@/features/settings/settings';
import { useFiltresColonnes } from '@/shared/hooks/useFiltresColonnes';
import { formatDateShortFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';
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
  /** Les animaux, par identifiant : la date de pose d'une boucle est celle de la fiche de l'animal qui la porte. */
  const [animaux, setAnimaux] = useState<Map<string, Chevre>>(new Map());
  useEffect(() => {
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then((liste) => {
      setAnimaux(new Map(liste.map((a) => [a.id, a])));
      setMorts(new Set(liste.filter((a) => a.statut !== STATUT_CHEVRE.VIVANTE).map((a) => a.id)));
    });
  }, [boucles]);
  // Avec la synchronisation, les listes montrent toujours l'état des fiches du cheptel (posée, date de pose, animal mort), même quand
  // l'inventaire n'a pas encore été remis à jour ; désactivée, l'inventaire et le cheptel ne se parlent plus.
  const { settings } = useAppSettings();
  const bouclesAvecDates = synchroBouclesActive(settings.exploitation)
    ? bouclesSelonLeCheptel(boucles, [...animaux.values()])
    : boucles;

  const triees = trierBoucles(
    bouclesDeLInventaire({ boucles: bouclesAvecDates }, etat, article),
    tri,
    croissant,
  );
  /** Le filtre de chaque colonne, comme dans Excel : les valeurs sont celles qu'affiche le tableau. */
  const filtres = useFiltresColonnes<BoucleStock, 'numero' | 'pose' | 'achat' | 'morte'>({
    numero: (b) => b.numero,
    pose: (b) =>
      b.datePose
        ? formatDateShortFR(b.datePose)
        : b.chevreId
          ? TEXTES.stock.boucles.posee
          : nePasPoser(b)
            ? TEXTES.stock.boucles.nePasPoser
            : '',
    achat: (b) => formatDateShortFR(b.dateAchat),
    morte: (b) =>
      b.chevreId && morts.has(b.chevreId) ? TEXTES.stock.boucles.morteOui : TEXTES.stock.boucles.morteNon,
  });
  const lignes = filtres.filtrer(triees);

  const trierPar = (colonne: ValeurDe<typeof TRI_BOUCLE>) => {
    if (colonne === tri) setCroissant(!croissant);
    else {
      setTri(colonne);
      setCroissant(true);
    }
  };

  /** Trie d'après une colonne dans le sens voulu (le menu d'une colonne : tri croissant, tri décroissant). */
  const trierEn = (colonne: ValeurDe<typeof TRI_BOUCLE>, sensCroissant: boolean) => {
    setTri(colonne);
    setCroissant(sensCroissant);
  };

  return {
    etat,
    setEtat,
    filtres,
    /** Les valeurs d'une colonne pour son filtre : celles de toutes les boucles de l'état choisi. */
    valeursDeLaColonne: (colonne: 'numero' | 'pose' | 'achat' | 'morte') => filtres.valeurs(triees, colonne),
    trierEn,
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

/** Les listes de boucles du contrôle des animaux (boucles, boucles rouges, rebouclage, tiptag), chacune avec son état et son tri. */
export function useListesBoucles(boucles: BoucleStock[]): ListeBoucles[] {
  const cle = (code: ValeurDe<typeof ARTICLE_BOUCLE>) => `${GENRE_ARTICLE.BOUCLE}:${code}`;
  const normales = useListeBoucles(boucles, cle(ARTICLE_BOUCLE.BOUCLES));
  const rouges = useListeBoucles(boucles, cle(ARTICLE_BOUCLE.ROUGES));
  const rebouclage = useListeBoucles(boucles, cle(ARTICLE_BOUCLE.REBOUCLAGE));
  const tiptag = useListeBoucles(boucles, cle(ARTICLE_BOUCLE.TIPTAG));
  return [normales, rouges, rebouclage, tiptag];
}
