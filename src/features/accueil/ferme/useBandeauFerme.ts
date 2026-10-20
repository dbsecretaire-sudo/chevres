import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import { useRappels } from '@/features/rappels/hooks/useRappels';
import { useRappelsCirculation } from '@/features/rappels/hooks/useRappelsCirculation';
import { useLotsARappeler } from '@/features/stock/hooks/useLotsARappeler';

/** Ce que le bandeau de la ferme montre : la balance de l'année et le nombre de rappels à valider (les mêmes chiffres que ceux de l'accueil). */
export function useBandeauFerme(): { balance?: number; rappels: number } {
  const accueil = useAccueil();
  const { rappels, valides } = useRappels();
  const envois = useRappelsCirculation(valides);
  const { aRappeler, aValider } = useLotsARappeler();
  return {
    balance: accueil.stats?.soldeFactures,
    rappels: rappels.length + envois.length + (aRappeler > 0 ? 1 : 0) + aValider.length,
  };
}
