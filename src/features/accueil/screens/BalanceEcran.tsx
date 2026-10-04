import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import { BalanceEntreprise } from '@/features/accueil/components/BalanceEntreprise';
import { useAccueilEntreprise } from '@/features/accueil/hooks/useAccueilEntreprise';

/** La balance des finances d'une entreprise : solde, recettes et dépenses de l'année, puis mois par mois. */
export default function BalanceEcran() {
  const accueil = useAccueilEntreprise();

  return (
    <Screen>
      <YearPicker annees={accueil.annees} value={accueil.annee} onChange={accueil.setAnneeActive} />
      <BalanceEntreprise annee={accueil.annee} balance={accueil.balance} parMois={accueil.parMois} />
    </Screen>
  );
}
