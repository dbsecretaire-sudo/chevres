import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useFiltreActivite } from '@/features/comptabilite/hooks/useFiltreActivite';
import { rentabilite, type Rentabilite } from '@/features/comptabilite/services/rentabilite';
import {
  construirePlan,
  type AnneePrecedente,
  type PlanEconomies,
} from '@/features/comptabilite/services/pistesEconomie';
import { listControles } from '@/features/exploitation/repository/controles';
import { productionLaitiere } from '@/features/exploitation/services/productionLaitiere';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import type { FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { reglagesTva } from '@/features/comptabilite/utils/reglagesTva';
import { calculerBilan } from '@/features/cheptel/services/bilanCheptel';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { REGIME_TVA_PILOTAGE } from '@/shared/constants/tva';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

interface OptionsPlan {
  annee: number;
  filtre: FiltreActivite;
  horsTaxes: boolean;
  effectif?: number;
  laitier: boolean;
}

/** Ce que l'année d'avant donnait : le coût alimentaire du litre et le lait par chèvre et par traite (rien quand elle n'a pas de lait). */
async function anneePrecedente(options: OptionsPlan): Promise<AnneePrecedente | undefined> {
  const { annee, ...autres } = options;
  const [r, production] = await Promise.all([rentabilite(annee - 1, autres), productionLaitiere(annee - 1)]);
  if (!(r.litresProduits > 0)) return undefined;
  const aliment = r.postes.find((p) => p.categorie === CATEGORIE_DEPENSE.ALIMENTATION)?.montant;
  return {
    coutAlimentParLitre: aliment !== undefined ? aliment / r.litresProduits : undefined,
    litresParChevreParTraite: production.litresParChevreParTraite,
  };
}

/** Le plan d'économies d'une année : les analyses du lait, le lait par traite et ce que l'année d'avant donnait. */
async function construirePlanDeLAnnee(r: Rentabilite, options: OptionsPlan): Promise<PlanEconomies> {
  const [controles, production, precedente] = await Promise.all([
    listControles(options.annee),
    productionLaitiere(options.annee),
    anneePrecedente(options),
  ]);
  const analyses = controles.filter((c) => c.famille === FAMILLE_CONTROLE.ANALYSE);
  return construirePlan({ rentabilite: r, production, precedente, analyses });
}

/** La rentabilité de l'année active et de l'activité choisie, rechargée à chaque retour sur l'écran. */
export function useRentabilite() {
  const { settings, setAnneeActive } = useAppSettings();
  const { espece, especes } = useEtablissement();
  const [filtre, setFiltre] = useFiltreActivite();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [resultat, setResultat] = useState<Rentabilite | null>(null);
  /** Le plan d'économies (pour une espèce laitière) : d'après les analyses du lait, le lait par traite et l'année d'avant. */
  const [plan, setPlan] = useState<PlanEconomies | null>(null);
  const annee = settings.anneeActive;
  const infos = settings.exploitation;
  const { regime } = reglagesTva(infos);
  /** Les montants s'entendent hors taxes quand la TVA est déclarée (réel simplifié ou normal). */
  const horsTaxes =
    regime === REGIME_TVA_PILOTAGE.REEL_SIMPLIFIE || regime === REGIME_TVA_PILOTAGE.REEL_NORMAL;

  /** Le lait ne concerne que les espèces laitières (chèvres, brebis, vaches) : pas de coût du litre pour des cochons ou des poules. */
  const laitier = (filtre === TOUTES_ACTIVITES || filtre === ACTIVITE_COMMUNE ? especes : [filtre]).some(
    laiterieActive,
  );

  const charger = useCallback(async () => {
    // Le coût par animal se calcule sur le nombre de femelles (les chèvres, de 6 mois et plus) vivantes au 31/12 de l'espèce
    // active, comme le bilan annuel : avec « Tout » ou « Commun », toutes les charges s'y rapportent ; avec l'activité d'une autre
    // espèce, ce nombre ne la concerne pas.
    const autreEspece = filtre !== TOUTES_ACTIVITES && filtre !== ACTIVITE_COMMUNE && filtre !== espece;
    const effectif = autreEspece ? undefined : (await calculerBilan(annee)).chevresVivantesFinAnnee;
    const [toutesAnnees, r] = await Promise.all([
      toutesLesAnneesConnues(),
      rentabilite(annee, { filtre, horsTaxes, effectif, laitier }),
    ]);
    setAnnees(toutesAnnees);
    setResultat(r);
    setPlan(
      laitier ? await construirePlanDeLAnnee(r, { annee, filtre, horsTaxes, effectif, laitier }) : null,
    );
  }, [annee, filtre, horsTaxes, espece, laitier]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee, annees, setAnneeActive, filtre, setFiltre, resultat, laitier, plan };
}
