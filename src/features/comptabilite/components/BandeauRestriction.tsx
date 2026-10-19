import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.listeTransactions;

/** Le bandeau de la liste des écritures ouverte depuis un lieu de la ferme : de qui sont les écritures montrées, et de quoi tout réafficher. */
export function BandeauRestriction({ titre, onEffacer }: { titre: string; onEffacer: () => void }) {
  return (
    <View style={styles.bandeau}>
      <Ionicons name="funnel" size={18} color={colors.primary} />
      <Text style={styles.texte} numberOfLines={2}>
        {T.restriction(titre)}
      </Text>
      <Pressable onPress={onEffacer} hitSlop={8} accessibilityRole="button" accessibilityLabel={T.toutAfficher} style={styles.bouton}>
        <Text style={styles.boutonTexte}>{T.toutAfficher}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.badgeBg, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  texte: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  bouton: { borderRadius: 999, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4 },
  boutonTexte: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
