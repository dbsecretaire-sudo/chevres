import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { DateField } from '@/shared/components/DateField';
import { SelectField } from '@/shared/components/SelectField';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { ChampActivite } from '@/features/comptabilite/components/ChampActivite';
import { SectionDepense } from '@/features/comptabilite/components/ecriture/SectionDepense';
import { SectionRecette } from '@/features/comptabilite/components/ecriture/SectionRecette';
import { useNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import type { TypeFacture } from '@/features/comptabilite/types';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const OPTIONS_TYPE = [
  { value: TYPE_FACTURE.RECUE, label: TEXTES.commun.general.debit },
  { value: TYPE_FACTURE.EMISE, label: TEXTES.commun.general.credit },
];

export default function NouvelleFacture() {
  useAjoutTabBarBleu();
  const params = useLocalSearchParams<{ type?: TypeFacture }>();
  const e = useNouvelleEcriture(params.type);

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            <SelectField
              label={TEXTES.commun.general.type}
              required
              value={e.type}
              onChange={e.setType}
              options={OPTIONS_TYPE}
            />
          </View>
          <View style={commonStyles.flex1}>
            <DateField label={TEXTES.commun.general.date} required value={e.date} onChange={e.setDate} />
          </View>
        </View>

        <ChampActivite value={e.activite} onChange={e.changerActivite} avecCommun={e.avecCommunActivite} />

        {e.type === TYPE_FACTURE.RECUE ? <SectionDepense e={e} /> : <SectionRecette e={e} />}

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={e.annuler}
          />
          <Button
            style={commonStyles.flex1}
            label={TEXTES.commun.general.enregistrer}
            onPress={e.enregistrer}
            loading={e.enregistrement}
          />
        </View>
      </Screen>

      <InfoModal
        visible={!!e.erreur}
        title={e.erreur?.titre ?? ''}
        message={e.erreur?.message}
        onClose={() => e.setErreur(null)}
      />
    </AccentColorProvider>
  );
}
