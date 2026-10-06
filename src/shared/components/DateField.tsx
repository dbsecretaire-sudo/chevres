import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/shared/theme/colors';
import { estDateISO, formatDateFR, toISODate } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { HEURE_MIDI } from '@/shared/constants/temps';
import { TEXTES } from '@/shared/textes';

interface Props {
  label: string;
  value: string; // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
}

export function DateField({ label, value, onChange, required }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  // Sur le web on tape la date : le texte en cours de saisie reste ici, et seule une vraie date remonte au formulaire.
  const [saisie, setSaisie] = useState(value);
  const [valeurVue, setValeurVue] = useState(value);
  if (valeurVue !== value) {
    // La valeur a changé de l'extérieur (chargement, bouton) : la saisie la suit.
    setValeurVue(value);
    setSaisie(value);
  }

  if (Platform.OS === 'web') {
    const invalide = saisie !== '' && !estDateISO(saisie);
    return (
      <View style={commonStyles.gap6}>
        <Text style={commonStyles.lineSemiBold}>
          {label}
          {required ? <Text style={commonStyles.required}> *</Text> : null}
        </Text>
        <TextInput
          style={[commonStyles.inputBox, invalide && { borderColor: colors.danger }]}
          value={saisie}
          onChangeText={(texte) => {
            setSaisie(texte);
            if (estDateISO(texte)) onChange(texte);
          }}
          placeholder={TEXTES.commun.dateField.aaaaMmJj}
          placeholderTextColor={colors.textMuted}
        />
        {invalide ? <Text style={commonStyles.required}>{TEXTES.commun.dateField.invalide}</Text> : null}
      </View>
    );
  }

  const dateValue = value ? new Date(`${value}${HEURE_MIDI}`) : new Date();

  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineSemiBold}>
        {label}
        {required ? <Text style={commonStyles.required}> *</Text> : null}
      </Text>
      <Pressable style={commonStyles.inputBox} onPress={() => setShowPicker(true)}>
        <Text style={commonStyles.valueText}>{formatDateFR(value)}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={(_event, selected) => {
            onChange(toISODate(selected));
            if (Platform.OS === 'android') setShowPicker(false);
          }}
          onDismiss={() => setShowPicker(false)}
        />
      )}
    </View>
  );
}
