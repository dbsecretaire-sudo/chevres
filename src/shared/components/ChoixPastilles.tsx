import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Des choix en pastilles, dont un seul est actif (vert plein) : le taux de TVA, le règlement d'une écriture. */
export function ChoixPastilles<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.rangee}>
      {options.map((option) => {
        const actif = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            onPress={() => onChange(option.value)}
            style={[styles.pastille, actif && styles.pastilleActive]}
          >
            <Text style={[styles.texte, actif && styles.texteActif]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pastille: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pastilleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  texte: { fontWeight: '600', color: colors.text },
  texteActif: { color: colors.blanc },
});
