import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  echeancesGroupements,
  terminerContenu,
  type EcheanceGroupement,
} from '@/features/exploitation/repository/controles';
import { GENRE_RAPPEL } from '@/shared/constants/rappels';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import {
  genresApplicables,
  rappelsDus,
  rappelsGroupements,
  type GenreRappel,
  type Rappel,
} from '@/features/rappels/services/rappels';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { todayISO } from '@/shared/utils/dates';

/** Les rappels de déclaration de l'établissement actif, et de quoi les valider ou les (dés)activer. */
export function useRappels() {
  const { settings, patchSettings } = useAppSettings();
  // Se recalcule au changement d'établissement (son type change).
  useEtablissement();
  const infos = settings.exploitation;
  const contexte = {
    elevage: !modeEntreprise(),
    activites: activitesEtablissement(),
    desactives: infos?.rappelsDesactives,
    valides: infos?.rappelsValides,
  };
  const declarations = useMemo(
    () => rappelsDus(todayISO(), contexte),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contexte.elevage, contexte.activites, contexte.desactives, contexte.valides],
  );
  /** Les échéances des contenus des groupements, relues à chaque retour sur l'écran. */
  const [echeances, setEcheances] = useState<EcheanceGroupement[]>([]);
  const chargerEcheances = useCallback(() => echeancesGroupements().then(setEcheances), []);
  useFocusEffect(
    useCallback(() => {
      chargerEcheances();
    }, [chargerEcheances]),
  );
  const rappels = useMemo(
    () =>
      [...declarations, ...rappelsGroupements(echeances, todayISO())].sort((a, b) =>
        a.echeance.localeCompare(b.echeance),
      ),
    [declarations, echeances],
  );
  const genres: GenreRappel[] = genresApplicables(contexte);

  const valider = async (rappel: Rappel) => {
    // L'échéance d'un groupement se valide en terminant son contenu ; une déclaration, en la notant dans les réglages.
    if (rappel.genre === GENRE_RAPPEL.GROUPEMENT && rappel.groupementId && rappel.contenuId) {
      await terminerContenu(rappel.groupementId, rappel.contenuId);
      await chargerEcheances();
      return;
    }
    patchSettings({
      exploitation: { ...infos, rappelsValides: [...(infos?.rappelsValides ?? []), rappel.id] },
    });
  };
  /** Un rappel validé par erreur revient dans ceux à valider. */
  const rouvrir = (id: string) =>
    patchSettings({
      exploitation: { ...infos, rappelsValides: (infos?.rappelsValides ?? []).filter((v) => v !== id) },
    });
  const activer = (genre: GenreRappel, actif: boolean) =>
    patchSettings({
      exploitation: {
        ...infos,
        rappelsDesactives: actif
          ? (infos?.rappelsDesactives ?? []).filter((g) => g !== genre)
          : [...new Set([...(infos?.rappelsDesactives ?? []), genre])],
      },
    });

  return {
    rappels,
    genres,
    desactives: infos?.rappelsDesactives ?? [],
    valides: infos?.rappelsValides ?? [],
    valider,
    rouvrir,
    activer,
  };
}
