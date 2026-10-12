import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useFiltreActivite } from '@/features/comptabilite/hooks/useFiltreActivite';
import { rentabilite, type Rentabilite } from '@/features/comptabilite/services/rentabilite';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';
import { reglagesTva } from '@/features/comptabilite/utils/reglagesTva';
import { calculerBilan } from '@/features/cheptel/services/bilanCheptel';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { REGIME_TVA_PILOTAGE } from '@/shared/constants/tva';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

/** La rentabilité de l'année active et de l'activité choisie, rechargée à chaque retour sur l'écran. */
export function useRentabilite() {
  const { settings, setAnneeActive } = useAppSettings();
  const { espece } = useEtablissement();
  const [filtre, setFiltre] = useFiltreActivite();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [resultat, setResultat] = useState<Rentabilite | null>(null);
  const annee = settings.anneeActive;
  const infos = settings.exploitation;
  const { regime } = reglagesTva(infos);
  /** Les montants s'entendent hors taxes quand la TVA est déclarée (réel simplifié ou normal). */
  const horsTaxes =
    regime === REGIME_TVA_PILOTAGE.REEL_SIMPLIFIE || regime === REGIME_TVA_PILOTAGE.REEL_NORMAL;

  const charger = useCallback(async () => {
    // Le coût par animal se calcule sur le nombre de femelles (les chèvres, de 6 mois et plus) vivantes au 31/12 de l'espèce
    // active, comme le bilan annuel : avec « Tout » ou « Commun », toutes les charges s'y rapportent ; avec l'activité d'une autre
    // espèce, ce nombre ne la concerne pas.
    const autreEspece = filtre !== TOUTES_ACTIVITES && filtre !== ACTIVITE_COMMUNE && filtre !== espece;
    const effectif = autreEspece ? undefined : (await calculerBilan(annee)).chevresVivantesFinAnnee;
    const [toutesAnnees, r] = await Promise.all([
      toutesLesAnneesConnues(),
      rentabilite(annee, { filtre, horsTaxes, effectif }),
    ]);
    setAnnees(toutesAnnees);
    setResultat(r);
  }, [annee, filtre, horsTaxes, espece]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee, annees, setAnneeActive, filtre, setFiltre, resultat };
}
