import { useState } from 'react';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { TOUTES_ACTIVITES, type FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { plusieursEspeces } from '@/shared/dictionnaire/animaux';

type VuePropre = typeof TOUTES_ACTIVITES | typeof ACTIVITE_COMMUNE;

/**
 * Activité affichée par la comptabilité. « Tout » et « Commun » sont des vues propres à l'écran ; un cheptel, lui, est
 * l'espèce active de toute l'application. Le filtre suit donc l'espèce active sans recréer l'écran : choisir un animal
 * ne fait que changer le filtre, comme « Commun ».
 */
export function useFiltreActivite(): [FiltreActivite, (filtre: FiltreActivite) => void] {
  const { espece } = useEtablissement();
  // null : on suit l'espèce active (ou « Tout » quand l'établissement n'en élève qu'une).
  const [vue, setVue] = useState<VuePropre | null>(!plusieursEspeces() ? TOUTES_ACTIVITES : null);

  const filtre: FiltreActivite = vue ?? espece;
  const choisir = (nouveau: FiltreActivite) =>
    setVue(nouveau === TOUTES_ACTIVITES || nouveau === ACTIVITE_COMMUNE ? nouveau : null);

  return [filtre, choisir];
}
