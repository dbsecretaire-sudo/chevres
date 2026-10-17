import { Text, View } from 'react-native';
import { BoucleField } from '@/features/cheptel/components/BoucleField';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { CabritNaissanceForm } from '@/features/cheptel/hooks/useNouvelleNaissance';
import { OPTIONS_SEXE } from '@/features/cheptel/utils/optionsSexe';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  cabrit: CabritNaissanceForm;
  numero: number;
  /** Faux s'il n'y a qu'un cabri : on ne peut pas le retirer. */
  retirable: boolean;
  onChange: (patch: Partial<CabritNaissanceForm>) => void;
  onRetirer: () => void;
}

/** Bloc de saisie d'un cabri dans le formulaire de naissance. */
export function CabritNaissanceBloc({ cabrit, numero, retirable, onChange, onRetirer }: Props) {
  return (
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.cardTitle}>
          {TEXTES.commun.general.cabriEspace}
          {numero}
        </Text>
        {retirable && <Button label={TEXTES.commun.general.retirer} variant="danger" onPress={onRetirer} />}
      </View>
      <BoucleField
        label={TEXTES.commun.general.nDeBoucle}
        value={cabrit.numeroBoucle}
        onChangeText={(v) => onChange({ numeroBoucle: v })}
        placeholder={TEXTES.commun.general.facultatifAvantAgeMax}
      />
      <SelectField
        label={TEXTES.commun.general.sexe}
        required
        value={cabrit.sexe}
        onChange={(v) => onChange({ sexe: v })}
        options={OPTIONS_SEXE}
      />
      <FormField
        label={TEXTES.commun.general.nom}
        value={cabrit.nom}
        onChangeText={(v) => onChange({ nom: v })}
        placeholder={TEXTES.commun.general.facultatif}
      />
      <View style={commonStyles.gap10}>
        <Checkbox
          label={TEXTES.commun.general.mortNe}
          value={cabrit.mortNe}
          onChange={(v) => onChange({ mortNe: v })}
          activeColor={colors.danger}
        />
      </View>
    </Card>
  );
}
