import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { Text } from 'react-native';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import {
  CarteBoucs,
  CarteCabris,
  CarteChevres,
  CarteEffectif,
} from '@/features/cheptel/components/bilan/CartesBilan';
import { useBilanAnnuel } from '@/features/cheptel/hooks/useBilanAnnuel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function BilanAnnuel() {
  const { annee, annees, setAnneeActive, bilan, bilanPrecedent } = useBilanAnnuel();

  if (!bilan) return null;

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>

      <Text style={commonStyles.muted}>
        {TEXTES.cheptel.bilanAnnuel.comparaisonEspace}
        {annee} {TEXTES.cheptel.bilanAnnuel.precedenteAnneeEntreParenthesesDeuxPoints}
        {annee - 1})
      </Text>

      <CarteCabris bilan={bilan} precedent={bilanPrecedent} annee={annee} />
      <CarteChevres bilan={bilan} precedent={bilanPrecedent} annee={annee} />
      <CarteBoucs bilan={bilan} precedent={bilanPrecedent} annee={annee} />
      <CarteEffectif bilan={bilan} annee={annee} />
    </Screen>
  );
}
