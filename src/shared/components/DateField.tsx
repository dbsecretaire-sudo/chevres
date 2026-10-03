import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/shared/theme/colors';
import { formatDateFR, toISODate } from '@/shared/utils/dates';
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

  if (Platform.OS === 'web') {
    return (
      <View style={commonStyles.gap6}>
        <Text style={commonStyles.lineSemiBold}>
          {label}
          {required ? <Text style={commonStyles.required}> *</Text> : null}
        </Text>
        <TextInput
          style={commonStyles.inputBox}
          value={value}
          onChangeText={onChange}
          placeholder={TEXTES.commun.dateField.aaaaMmJj}
          placeholderTextColor={colors.textMuted}
        />
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
          onChange={(event, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (event.type === 'dismissed') {
              setShowPicker(false);
              return;
            }
            if (selected) onChange(toISODate(selected));
            if (Platform.OS === 'android') setShowPicker(false);
          }}
        />
      )}
    </View>
  );
}
