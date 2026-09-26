import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { useAccentColor } from '@/theme/AccentColorContext';

interface Props {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
}

export function Checkbox({ label, value, onChange, activeColor }: Props) {
  const accent = useAccentColor();
  const couleurActive = activeColor ?? accent;
  return (
    <Pressable style={styles.row} onPress={() => onChange(!value)}>
      <Ionicons name={value ? 'checkbox' : 'square-outline'} size={22} color={value ? couleurActive : colors.textMuted} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
});
