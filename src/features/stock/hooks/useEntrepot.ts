import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { useFiltreEspeceStock } from '@/features/stock/hooks/useFiltreEspeceStock';
import { useNiveauxStock } from '@/features/stock/hooks/useNiveauxStock';
import { lireArchiveStock } from '@/features/stock/repository';
import { bouclesDeLInventaire, estBoucleNumerotee, nePasPoser } from '@/features/stock/services/boucles';
import {
  carteDesOeufs,
  carteDuLait,
  groupesDeLaCategorie,
  type GroupeDeCartes,
} from '@/features/stock/services/entrepotJeu';
import { bilanLait, prixDesOeufs } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import type { Section } from '@/features/stock/utils/categories';
import {
  articlesDeLaSection,
  categoriesDuStock,
  type CategorieDuStock,
} from '@/features/stock/utils/structureStock';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { ETAT_BOUCLE } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux.entrepot;

/** Les catégories du stock et, pour chacune (par sa clé de catégorie), ses rubriques avec leurs cartes. */
export interface Entrepot {
  categories: CategorieDuStock[];
  groupesParCategorie: Map<string, GroupeDeCartes[]>;
}

/**
 * Le stock tel que l'entrepôt le montre : ses catégories et, pour chacune, ses rubriques avec leurs cartes et ce qu'il en reste. Il relit le stock
 * à chaque retour sur l'écran, y compris les lignes qui suivent le cheptel (cabris, animal sur pied, animal vivant) : l'entrepôt et la
 * transformation montrent donc toujours la même chose que l'écran du stock.
 */
export function useEntrepot(): Entrepot {
  const { concernees, fromagerie, poules, filtreCourant } = useFiltreEspeceStock();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  // Les litres de lait vendus : le bilan du lait en a besoin pour dire ce qu'il en reste.
  const [ventesLait, setVentesLait] = useState<{ id: string; date: string; litres: number }[]>([]);
  const litresVendus = ventesLait.reduce((total, v) => total + v.litres, 0);
  const niveauxDuCheptel = useNiveauxStock();

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then(setArchive)
        .catch(() => undefined);
      listToutesVentes()
        .then((ventes) =>
          setVentesLait(
            ventes
              .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT)
              .map((v) => ({ id: v.id, date: v.date, litres: v.quantite ?? 0 })),
          ),
        )
        .catch(() => undefined);
    }, []),
  );

  const categories = useMemo(
    () => (archive ? categoriesDuStock(archive, fromagerie, poules, concernees) : []),
    [archive, fromagerie, poules, concernees],
  );
  const groupesParCategorie = useMemo(() => {
    const parCategorie = new Map<string, GroupeDeCartes[]>();
    if (!archive) return parCategorie;
    const niveau = (cle: string): number => {
      // Les boucles numérotées se comptent dans l'inventaire (celles qui ne sont pas encore posées) ; les autres lignes, par leurs mouvements.
      if (estBoucleNumerotee(cle))
        return bouclesDeLInventaire(archive, ETAT_BOUCLE.NON_POSEE, cle).filter((b) => !nePasPoser(b)).length;
      return niveauxDuCheptel.get(cle) ?? 0;
    };
    const lecture = {
      articlesDe: (genre: Parameters<typeof articlesDeLaSection>[0], section?: string, listeId?: string) =>
        articlesDeLaSection(genre, section as Section | undefined, archive, filtreCourant, listeId),
      niveau,
      lait: fromagerie ? carteDuLait(T.lait, bilanLait(archive, litresVendus, ventesLait).restant) : undefined,
      oeufs: poules ? carteDesOeufs(T.oeufs, prixDesOeufs(archive)) : undefined,
    };
    for (const c of categories) parCategorie.set(c.categorie, groupesDeLaCategorie(c, lecture));
    return parCategorie;
  }, [archive, categories, filtreCourant, fromagerie, poules, litresVendus, ventesLait, niveauxDuCheptel]);

  return { categories, groupesParCategorie };
}
