import { Pressable, ScrollView, Text } from 'react-native';
import { styles } from '@/shared/styles/components/YearPicker.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  annees: number[];
  value: number;
  onChange: (annee: number) => void;
}

export function YearPicker({ annees, value, onChange }: Props) {
  const anneesTriees = [...annees].sort((a, b) => a - b);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowCompact}>
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
    </ScrollView>
  );
}
