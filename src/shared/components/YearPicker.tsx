import { Pressable, Text } from 'react-native';
import { DefilementFleches } from '@/shared/components/DefilementFleches';
import { styles } from '@/shared/styles/components/YearPicker.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  annees: number[];
  value: number;
  onChange: (annee: number) => void;
}

export function YearPicker({ annees, value, onChange }: Props) {
  // De la plus récente à la plus ancienne : 2026, 2025, 2024…
  const anneesTriees = [...annees].sort((a, b) => b - a);
  return (
    <DefilementFleches contentContainerStyle={styles.rowCompact}>
      {anneesTriees.map((annee) => {
        const selected = annee === value;
        return (
          <Pressable
            key={annee}
            onPress={() => onChange(annee)}
            style={[commonStyles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && commonStyles.textWhite]}>{annee}</Text>
          </Pressable>
        );
      })}
    </DefilementFleches>
  );
}
