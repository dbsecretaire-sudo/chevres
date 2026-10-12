import type { InfosExploitation } from '@/features/settings/settings';
import type { PeriodiciteTva, RegimeTvaPilotage } from '@/features/comptabilite/services/pilotageTva';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import {
  PERIODICITE_TVA,
  PERIODICITE_TVA_PAR_DEFAUT,
  REGIME_TVA_PILOTAGE,
  REGIME_TVA_PILOTAGE_PAR_DEFAUT,
} from '@/shared/constants/tva';

const REGIMES: readonly string[] = Object.values(REGIME_TVA_PILOTAGE);
const PERIODICITES: readonly string[] = Object.values(PERIODICITE_TVA);

/**
 * Les réglages de TVA qui s'appliquent : ceux de la comptabilité, à défaut le régime d'une entreprise (ses informations), à défaut le
 * réel simplifié mois par mois. Une entreprise qui n'est pas assujettie à la TVA est en franchise.
 */
export function reglagesTva(infos: InfosExploitation | undefined): {
  regime: RegimeTvaPilotage;
  periodicite: PeriodiciteTva;
  tauxRfa?: number;
} {
  const choisi = infos?.tva?.regime;
  const deLEntreprise = modeEntreprise() ? infos?.entreprise?.regimeTva : undefined;
  const regime =
    modeEntreprise() && !infos?.entreprise?.tvaApplicable
      ? REGIME_TVA_PILOTAGE.FRANCHISE
      : (((choisi && REGIMES.includes(choisi) ? choisi : deLEntreprise) as RegimeTvaPilotage | undefined) ??
        REGIME_TVA_PILOTAGE_PAR_DEFAUT);
  const periodicite = infos?.tva?.periodicite;
  return {
    regime,
    periodicite: (periodicite && PERIODICITES.includes(periodicite)
      ? periodicite
      : PERIODICITE_TVA_PAR_DEFAUT) as PeriodiciteTva,
    tauxRfa: infos?.tva?.tauxRfa,
  };
}
