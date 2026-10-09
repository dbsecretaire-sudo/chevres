import { Text, View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { CabritNaissanceBloc } from '@/features/cheptel/components/CabritNaissanceForm';
import { DateField } from '@/shared/components/DateField';
import { Button } from '@/shared/components/Button';
import { SectionForm } from '@/shared/components/SectionForm';
import { colors } from '@/shared/theme/colors';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { useNouvelleNaissance } from '@/features/cheptel/hooks/useNouvelleNaissance';
import { styles } from '@/shared/styles/cheptel/NouvelleNaissance.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function NouvelleNaissance() {
  useAjoutTabBarBleu();
  const e = useNouvelleNaissance();

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <SectionForm titre={TEXTES.commun.formulaire.naissance}>
          <DateField
            label={TEXTES.commun.general.dateDeLaMiseBas}
            required
            value={e.date}
            onChange={e.setDate}
          />
          {/* La mère se choisit parmi les femelles vivantes qui avaient atteint la maturité sexuelle à la date de la mise bas. */}
          <SelectField
            label={TEXTES.commun.general.nDeBoucleDeLa}
            required
            searchable
            value={e.mereNumeroBoucle}
            onChange={e.setMereNumeroBoucle}
            options={e.optionsMeres}
            placeholder={TEXTES.cheptel.nouvelleNaissance.choisirLaMere}
          />
        </SectionForm>

        <Text style={styles.sectionTitle}>
          {TEXTES.cheptel.nouvelleNaissance.cabris}
          {e.cabrits.length})
        </Text>
        {e.cabrits.map((cabrit, index) => (
          <CabritNaissanceBloc
            key={cabrit.key}
            cabrit={cabrit}
            numero={index + 1}
            retirable={e.cabrits.length > 1}
            onChange={(patch) => e.majCabrit(cabrit.key, patch)}
            onRetirer={() => e.supprimerCabrit(cabrit.key)}
          />
        ))}

        <Button label={TEXTES.commun.general.ajouterUnCabri} variant="secondary" onPress={e.ajouterCabrit} />

        <FormField
          label={TEXTES.commun.general.notes}
          value={e.notes}
          onChangeText={e.setNotes}
          placeholder={TEXTES.commun.general.facultatif}
          multiline
          style={commonStyles.textareaHaute}
        />

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={e.annuler}
          />
          <Button
            style={commonStyles.flex1}
            label={TEXTES.cheptel.nouvelleNaissance.enregistrerLaNaissance}
            onPress={e.enregistrer}
            loading={e.enregistrement}
          />
        </View>
      </Screen>
    </AccentColorProvider>
  );
}
