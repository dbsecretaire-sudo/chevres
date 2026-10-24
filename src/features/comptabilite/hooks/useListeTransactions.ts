import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { FiltresTransactions } from '@/features/comptabilite/components/FiltreTransactionsModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useFiltreActivite } from '@/features/comptabilite/hooks/useFiltreActivite';
import {
  FILTRES_VIDES,
  calculerSoldes,
  filtrerParActivite,
  filtrerParRubrique,
  type RubriqueComptabilite,
  filtrerTransactions,
  filtresSontActifs,
  ecrituresParTiers,
} from '@/features/comptabilite/services/filtresTransactions';
import { listTransactions, type Transaction } from '@/features/comptabilite/services/transactions';
import { RUBRIQUE_COMPTABILITE } from '@/shared/constants/comptabilite';
import { ETAT_CONSERVE } from '@/shared/constants/etatConserve';
import { useEtatConserve } from '@/features/etablissements/hooks/useEtatConserve';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { memeJourDansLAnnee } from '@/shared/utils/dates';

/**
 * Transactions de l'année active (ou de toutes les années quand « Tout » est choisi), par activité, filtrées et recherchées,
 * avec leurs soldes. Les dates d'un filtre en cours suivent l'année active ; avec « Tout », leur année est libre.
 */
export function useListeTransactions() {
  const router = useRouter();
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  // Ouverte depuis la page d'un lieu de la ferme : seulement ses écritures (leurs identifiants), rangées par tiers.
  const { ecritures: idsDemandes, titre: titreDemande } = useLocalSearchParams<{ ecritures?: string; titre?: string }>();
  const restriction = useMemo(
    () => (idsDemandes ? { ids: new Set(idsDemandes.split(';')), titre: titreDemande ?? '' } : undefined),
    [idsDemandes, titreDemande],
  );
  const regrouper = !!settings.toutesAnnees;
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // La recherche, les filtres et la rubrique restent quand on quitte l'écran (ouvrir une écriture, changer de menu).
  const [filtres, setFiltres] = useEtatConserve<FiltresTransactions>(
    ETAT_CONSERVE.COMPTABILITE_FILTRES,
    FILTRES_VIDES,
  );
  const [filtreOuvert, setFiltreOuvert] = useState(false);
  const [recherche, setRecherche] = useEtatConserve(ETAT_CONSERVE.COMPTABILITE_RECHERCHE, '');
  const [filtreActivite, setFiltreActivite] = useFiltreActivite();
  const [rubrique, setRubrique] = useEtatConserve<RubriqueComptabilite>(
    ETAT_CONSERVE.COMPTABILITE_RUBRIQUE,
    RUBRIQUE_COMPTABILITE.TOUT,
  );
  // Une année active choisie (ou changée) : les dates du filtre en cours passent dans cette année. Avec « Tout », l'année reste libre.
  const anneeDuFiltre = regrouper ? undefined : settings.anneeActive;
  const [anneeVue, setAnneeVue] = useState(anneeDuFiltre);
  if (anneeVue !== anneeDuFiltre) {
    setAnneeVue(anneeDuFiltre);
    if (anneeDuFiltre !== undefined) {
      setFiltres((f) => ({
        ...f,
        dateDebut: memeJourDansLAnnee(f.dateDebut, anneeDuFiltre),
        dateFin: memeJourDansLAnnee(f.dateFin, anneeDuFiltre),
      }));
    }
  }

  const charger = useCallback(async () => {
    const [toutesAnnees, liste] = await Promise.all([
      toutesLesAnneesConnues(),
      listTransactions(regrouper ? undefined : settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setTransactions(liste);
  }, [settings.anneeActive, regrouper]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const filtrees = useMemo(
    () =>
      restriction
        ? ecrituresParTiers(transactions.filter((t) => restriction.ids.has(t.id)))
        : filtrerTransactions(
            filtrerParRubrique(filtrerParActivite(transactions, filtreActivite), rubrique),
            filtres,
            recherche,
          ),
    [transactions, filtreActivite, rubrique, filtres, recherche, restriction],
  );

  return {
    filtreActivite,
    setFiltreActivite,
    rubrique,
    setRubrique,
    anneeActive: settings.anneeActive,
    setAnneeActive,
    choisirToutesAnnees,
    toutesAnnees: regrouper,
    annees,
    filtrees,
    soldes: calculerSoldes(filtrees),
    filtres,
    setFiltres,
    effacerFiltres: () => setFiltres(FILTRES_VIDES),
    filtresActifs: filtresSontActifs(filtres),
    filtreOuvert,
    setFiltreOuvert,
    recherche,
    setRecherche,
    recharger: charger,
    /** Les écritures d'un lieu seulement (rangées par tiers) : son nom, et de quoi revenir à toute la liste. */
    restriction: restriction ? { titre: restriction.titre } : undefined,
    effacerRestriction: () => router.setParams({ ecritures: undefined, titre: undefined }),
  };
}
