import { useState } from 'react';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { groupesActifsEspece, laiterieActive } from '@/features/comptabilite/utils/recettes';
import type { FiltreStock } from '@/features/stock/services/stock';
import { GROUPE_RECETTE } from '@/shared/constants/comptabilite';
import { FILTRE_STOCK_TOUT } from '@/shared/constants/stock';

/**
 * Le filtre d'espèce de l'inventaire : un animal (l'animal actif d'office, quand l'exploitation en élève plusieurs) ou toutes les
 * activités. Un choix explicite l'emporte ; sans choix, le filtre suit l'animal actif. Il dit aussi ce que l'espèce vend : la
 * fromagerie et le lait (chèvres, brebis, vaches), les œufs (poules).
 */
export function useFiltreEspeceStock() {
  const { especes, espece: especeActive } = useEtablissement();
  const [filtre, setFiltre] = useState<FiltreStock | null>(null);
  const voulu: FiltreStock = filtre ?? especeActive;
  const filtreCourant: FiltreStock =
    voulu === FILTRE_STOCK_TOUT || especes.includes(voulu) ? voulu : FILTRE_STOCK_TOUT;
  /** Les espèces que le filtre concerne. */
  const concernees = filtreCourant === FILTRE_STOCK_TOUT ? especes : [filtreCourant];
  return {
    especes,
    especeActive,
    filtreCourant,
    setFiltre,
    concernees,
    fromagerie: concernees.some((espece) => laiterieActive(espece)),
    poules: concernees.some((espece) => groupesActifsEspece(espece).includes(GROUPE_RECETTE.OEUFS)),
  };
}
