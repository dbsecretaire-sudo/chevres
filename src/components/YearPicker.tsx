import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  annees: number[];
  value: number;
  onChange: (annee: number) => void;
}

export function YearPicker({ annees, value, onChange }: Props) {
  const anneesTriees = [...annees].sort((a, b) => a - b);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {anneesTriees.map((annee) => {
        const selected = annee === value;
        return (
          <Pressable
            key={annee}
            onPress={() => onChange(annee)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{annee}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.badgeBg,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  chipTextSelected: { color: '#fff' },
});
