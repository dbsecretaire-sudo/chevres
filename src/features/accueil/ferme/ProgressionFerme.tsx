import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Rebond, useRemplissage } from '@/features/accueil/ferme/animations';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme;

interface Props {
  faits: number;
  total: number;
  /** La prochaine échéance (« RSA dans 12 j ») et l'écran où la traiter. */
  prochaine?: { texte: string; route: string };
  /** Un appui sur la barre : la liste des rappels. */
  onOuvrir: () => void;
}

/**
 * La barre des papiers de l'année : ce qui est fait (déclarations validées, documents envoyés, bilan sanitaire) sur ce qui est à faire, avec
 * un coffre qui s'ouvre quand tout est à jour, et dessous la prochaine échéance.
 */
export function ProgressionFerme({ faits, total, prochaine, onOuvrir }: Props) {
  const router = useRouter();
  const complet = total === 0 || faits >= total;
  const largeur = useRemplissage(total === 0 ? 1 : Math.min(1, faits / total));
  return (
    <View style={styles.bloc}>
      <Pressable style={styles.ligne} onPress={onOuvrir} accessibilityRole="button" accessibilityLabel={TEXTES.rappels.titre}>
        <Ionicons name="document-text" size={26} color={colors.primary} />
        <View style={styles.piste} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: Math.max(total, 1), now: faits }}>
          <Animated.View style={[styles.remplissage, { width: largeur }]} />
          <Text style={styles.texte} numberOfLines={1}>
            {total === 0 ? T.rienAFaire : T.papiers(faits, total)}
          </Text>
        </View>
        <Rebond declencheur={complet && total > 0}>
          <Ionicons name={complet ? 'gift' : 'gift-outline'} size={30} color={complet ? colors.accent : colors.textMuted} />
        </Rebond>
      </Pressable>
      {complet && total > 0 ? <Text style={styles.bravo}>{T.toutAJour}</Text> : null}
      {prochaine ? (
        <Pressable style={styles.chrono} onPress={() => router.push(prochaine.route as never)} accessibilityRole="button">
          <Ionicons name="time-outline" size={16} color={colors.blanc} />
          <Text style={styles.chronoTexte}>{prochaine.texte}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 6, alignItems: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  piste: { flex: 1, height: 26, borderRadius: 13, backgroundColor: '#E6EBDD', overflow: 'hidden', justifyContent: 'center' },
  remplissage: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#A9CC8E' },
  texte: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  bravo: { fontSize: 13, fontWeight: '700', color: colors.primary },
  chrono: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryDark, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 },
  chronoTexte: { color: colors.blanc, fontSize: 13, fontWeight: '700' },
});
