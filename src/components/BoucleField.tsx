import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { useAccentColor } from '@/theme/AccentColorContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { ScannerBoucleModal } from './ScannerBoucleModal';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

/** Champ n° de boucle avec bouton pour le remplir en scannant l'étiquette à la caméra. */
export function BoucleField({ label, value, onChangeText, placeholder, required }: Props) {
  const accent = useAccentColor();
  const { settings } = useAppSettings();
  const indicatif = settings.exploitation?.indicatifMarquage;
  const [scannerOuvert, setScannerOuvert] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        {indicatif ? (
          <View style={styles.indicatifBadge}>
            <Text style={styles.indicatifTexte}>{indicatif}</Text>
          </View>
        ) : null}
        <TextInput
          style={[styles.input, styles.flex1]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />
        <Pressable style={styles.boutonScan} onPress={() => setScannerOuvert(true)}>
          <Ionicons name="camera" size={22} color={accent} />
        </Pressable>
      </View>

      <ScannerBoucleModal
        visible={scannerOuvert}
        onClose={() => setScannerOuvert(false)}
        onDetected={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  required: { color: colors.danger },
  row: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  flex1: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  indicatifBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: colors.badgeBg,
  },
  indicatifTexte: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  boutonScan: {
    width: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.badgeBg,
  },
});
