import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { listTousTraitements } from '@/features/sante/repository/traitements';
import { listToutesVisitesVeterinaire } from '@/features/sante/repository/visitesVeterinaire';
import { etatDuBilan, type BilanSanitaire } from '@/features/sante/services/bilanSanitaire';
import { animauxEnDelai, finLaPlusTardive } from '@/features/sante/services/delaisAttente';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ESPECES_PETITS_RUMINANTS } from '@/shared/constants/primes';
import { todayISO } from '@/shared/utils/dates';

/** Ce que la santé du troupeau demande aujourd'hui : les animaux en délai d'attente (lait, viande) et l'état du bilan sanitaire annuel. */
export interface SanteDuTroupeau {
  nombreLait: number;
  finLait?: string;
  nombreViande: number;
  finViande?: string;
  bilan: BilanSanitaire;
  /** Vrai pour les petits ruminants : seuls eux ont un bilan sanitaire annuel à suivre. */
  avecBilan: boolean;
}

const VIDE: SanteDuTroupeau = {
  nombreLait: 0,
  nombreViande: 0,
  bilan: { etat: 'valide' },
  avecBilan: false,
};

/** Relit la santé du troupeau (traitements, visites, animaux) à chaque retour sur l'écran, pour l'espèce courante. */
export function useSanteDuTroupeau(): SanteDuTroupeau {
  const { espece } = useEtablissement();
  const [sante, setSante] = useState<SanteDuTroupeau>(VIDE);
  useFocusEffect(
    useCallback(() => {
      const aujourdhui = todayISO();
      Promise.all([listChevresVivantes(), listTousTraitements(), listToutesVisitesVeterinaire()])
        .then(([animaux, traitements, visites]) => {
          const lait = animauxEnDelai(animaux, traitements, aujourdhui, 'lait');
          const viande = animauxEnDelai(animaux, traitements, aujourdhui, 'viande');
          setSante({
            nombreLait: lait.length,
            finLait: finLaPlusTardive(lait),
            nombreViande: viande.length,
            finViande: finLaPlusTardive(viande),
            bilan: etatDuBilan(visites, aujourdhui),
            avecBilan: ESPECES_PETITS_RUMINANTS.includes(espece),
          });
        })
        .catch(() => undefined);
    }, [espece]),
  );
  return sante;
}
