import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';

/** Le rail et les deux flèches à droite du cadre de jeu (la grange, le stock) : elles font défiler la liste d'un cran. */
export function BarreDeNavigation({ onHaut, onBas }: { onHaut: () => void; onBas: () => void }) {
  return (
    <View style={styles.fleches}>
      <Pressable style={styles.fleche} onPress={onHaut} accessibilityRole="button" accessibilityLabel="↑">
        <Ionicons name="chevron-up" size={22} color={colors.blanc} />
      </Pressable>
      <View style={styles.piste}>
        <View style={styles.curseur} />
      </View>
      <Pressable style={styles.fleche} onPress={onBas} accessibilityRole="button" accessibilityLabel="↓">
        <Ionicons name="chevron-down" size={22} color={colors.blanc} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fleches: { width: 34, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingRight: 4 },
  fleche: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3F6B1E',
    borderWidth: 2,
    borderColor: '#2B4C13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  piste: {
    flex: 1,
    width: 14,
    marginVertical: 6,
    borderRadius: 7,
    backgroundColor: '#3F6B1E',
    borderWidth: 2,
    borderColor: '#E8B13B',
    overflow: 'hidden',
  },
  curseur: { flex: 1, margin: 2, borderRadius: 4, backgroundColor: '#6FB52E' },
});
