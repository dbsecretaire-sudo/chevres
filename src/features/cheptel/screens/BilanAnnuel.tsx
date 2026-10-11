import { useState } from 'react';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { DeclarationChambre } from '@/features/cheptel/components/bilan/DeclarationChambre';
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
import { CARTE_BILAN } from '@/shared/constants/cheptel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function BilanAnnuel() {
  const { annee, annees, setAnneeActive, bilan, bilanPrecedent } = useBilanAnnuel();
  /** La carte déroulée : toutes sont enroulées au départ, et une seule est visible à la fois. */
  const [carteOuverte, setCarteOuverte] = useState<string | null>(null);
  const carte = (id: string) => ({
    ouverte: carteOuverte === id,
    onBasculer: () => setCarteOuverte((actuelle) => (actuelle === id ? null : id)),
  });

  if (!bilan) return null;

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>

      <DeclarationChambre annee={annee} />

      <Text style={commonStyles.muted}>
        {TEXTES.cheptel.bilanAnnuel.comparaisonEspace}
        {annee} {TEXTES.cheptel.bilanAnnuel.precedenteAnneeEntreParenthesesDeuxPoints}
        {annee - 1})
      </Text>

      <CarteCabris bilan={bilan} precedent={bilanPrecedent} annee={annee} {...carte(CARTE_BILAN.CABRIS)} />
      <CarteChevres bilan={bilan} precedent={bilanPrecedent} annee={annee} {...carte(CARTE_BILAN.CHEVRES)} />
      <CarteBoucs bilan={bilan} precedent={bilanPrecedent} annee={annee} {...carte(CARTE_BILAN.BOUCS)} />
      <CarteEffectif bilan={bilan} annee={annee} {...carte(CARTE_BILAN.EFFECTIF)} />
    </Screen>
  );
}
