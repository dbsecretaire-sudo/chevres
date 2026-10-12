import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { calculerBilan, type Bilan } from '@/features/cheptel/services/bilanCheptel';
import { listControles } from '@/features/exploitation/repository/controles';
import { totauxSurfaces } from '@/features/exploitation/services/surfaces';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { primesPercues, type PrimesPercues } from '@/features/cheptel/services/primesPercues';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

/** Bilan de l'année active, celui de l'année précédente (pour comparaison) et les années disponibles. */
export function useBilanAnnuel() {
  const { settings, setAnneeActive } = useAppSettings();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const annee = settings.anneeActive;

  const [annees, setAnnees] = useState<number[]>([annee]);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [bilanPrecedent, setBilanPrecedent] = useState<Bilan | null>(null);
  /** Les hectares admissibles des parcelles de l'année (espèce active) : la base des primes à l'hectare. */
  const [hectares, setHectares] = useState(0);
  /** Les aides perçues pendant la saison (septembre de l'année → août suivant) : elles se comparent aux primes calculées. */
  const [percues, setPercues] = useState<PrimesPercues>({});

  const charger = useCallback(async () => {
    const [b, bPrec, toutesAnnees, controles, aidesPercues] = await Promise.all([
      calculerBilan(annee),
      calculerBilan(annee - 1),
      toutesLesAnneesConnues(),
      listControles(annee),
      primesPercues(annee),
    ]);
    setPercues(aidesPercues);
    setBilan(b);
    setBilanPrecedent(bPrec);
    setAnnees(toutesAnnees);
    const parcelles = controles.filter((c) => c.famille === FAMILLE_CONTROLE.TERRAIN && !c.typeDocument);
    setHectares(totauxSurfaces(parcelles).surfaceAdmissible);
    // L'espèce n'est pas lue dans le chargement : elle sert à le relancer quand elle change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee, espece]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee, annees, setAnneeActive, bilan, bilanPrecedent, hectares, percues };
}
