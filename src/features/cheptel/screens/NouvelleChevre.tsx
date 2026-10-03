import { View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { BoucleField } from '@/features/cheptel/components/BoucleField';
import { CabritsChevreForm } from '@/features/cheptel/components/CabritsChevreForm';
import { DateField } from '@/shared/components/DateField';
import { SelectField } from '@/shared/components/SelectField';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { colors } from '@/shared/theme/colors';
import { currentYear } from '@/shared/utils/dates';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { useNouvelleChevre } from '@/features/cheptel/hooks/useNouvelleChevre';
import { OPTIONS_SEXE } from '@/features/cheptel/utils/optionsSexe';
import { commonStyles } from '@/shared/styles/commonStyles';
import { SEXE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';

export default function NouvelleChevre() {
  useAjoutTabBarBleu();
  const e = useNouvelleChevre();

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <BoucleField
          label={TEXTES.commun.general.nDeBoucle}
          value={e.numeroBoucle}
          onChangeText={e.setNumeroBoucle}
          placeholder={TEXTES.commun.general.facultatifAvantAgeMax}
        />
        {!!e.numeroBoucle.trim() && (
          <DateField
            label={TEXTES.commun.general.dateDeBouclage}
            value={e.dateBouclage}
            onChange={e.setDateBouclage}
          />
        )}
        <FormField
          label={TEXTES.commun.general.nom}
          value={e.nom}
          onChangeText={e.setNom}
          placeholder={TEXTES.commun.general.facultatif}
        />
        <SelectField
          label={TEXTES.commun.general.sexe}
          required
          value={e.sexe}
          onChange={e.setSexe}
          options={OPTIONS_SEXE}
        />
        <DateField
          label={TEXTES.commun.general.dateDeNaissance}
          required
          value={e.dateNaissance}
          onChange={e.setDateNaissance}
        />
        <BoucleField
          label={TEXTES.commun.general.nDeBoucleDeLa}
          value={e.mereNumeroBoucle}
          onChangeText={e.setMereNumeroBoucle}
          placeholder={TEXTES.commun.general.facultatif}
        />
        <FormField
          label={TEXTES.commun.general.notes}
          value={e.notes}
          onChangeText={e.setNotes}
          placeholder={TEXTES.commun.general.facultatif}
          multiline
          style={commonStyles.textareaHaute}
        />
        <Checkbox
          label={TEXTES.commun.general.designeEPourLeRenouvellement}
          value={e.renouvellement}
          onChange={e.setRenouvellement}
        />
        {e.renouvellement && (
          <FormField
            label={TEXTES.commun.general.anneeDeDesignation}
            value={e.renouvellementAnnee}
            onChangeText={e.setRenouvellementAnnee}
            keyboardType="number-pad"
            placeholder={String(currentYear())}
          />
        )}

        {e.sexe === SEXE.FEMELLE && (
          <Checkbox
            label={TEXTES.cheptel.nouvelleChevre.cetteChevreADesCabris}
            value={e.avecCabrits}
            onChange={e.setAvecCabrits}
          />
        )}

        {e.sexe === SEXE.FEMELLE && e.avecCabrits && <CabritsChevreForm e={e} />}

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
    </AccentColorProvider>
  );
}
