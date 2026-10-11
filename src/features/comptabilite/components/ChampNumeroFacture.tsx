import { Text, TextInput, View } from 'react-native';
import { Checkbox } from '@/shared/components/Checkbox';
import { useFondChamp } from '@/shared/theme/FondChampContext';
import { colors } from '@/shared/theme/colors';
import { MOTIF_NUMERO_FACTURE_NUMERIQUE } from '@/shared/constants/clients';
import { styles } from '@/shared/styles/comptabilite/ChampNumeroFacture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  value: string;
  onChange: (valeur: string) => void;
  /** Récolteur : le numéro peut contenir des lettres ; sinon des chiffres, tirets, barres et points. */
  libre: boolean;
  /** Le récolteur a une case « Réajustement » à côté du numéro : cochée, le champ du numéro disparaît (le titre reste). */
  reajustementPossible: boolean;
  reajustement: boolean;
  onReajustement: (reajustement: boolean) => void;
}

/** Le numéro de facture d'une vente déclarée, avec la case « Réajustement » d'un récolteur. */
export function ChampNumeroFacture({
  value,
  onChange,
  libre,
  reajustementPossible,
  reajustement,
  onReajustement,
}: Props) {
  const fond = useFondChamp();
  const champ = (
    <TextInput
      style={[commonStyles.input, { backgroundColor: fond }]}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={(v) => {
        if (libre || MOTIF_NUMERO_FACTURE_NUMERIQUE.test(v)) onChange(v);
      }}
      keyboardType={libre ? 'default' : 'numbers-and-punctuation'}
    />
  );
  return (
    <View style={commonStyles.gap6}>
      <View style={styles.entete}>
        <Text style={commonStyles.lineSemiBold}>
          {TEXTES.comptabilite.nouvelleEcriture.nDeFacture}
          {reajustement ? null : <Text style={commonStyles.required}> *</Text>}
        </Text>
        {reajustementPossible ? (
          <Checkbox
            label={TEXTES.comptabilite.nouvelleEcriture.reajustement}
            value={reajustement}
            onChange={onReajustement}
          />
        ) : null}
      </View>
      {reajustement ? null : champ}
    </View>
  );
}
