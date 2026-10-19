import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlecheRetourBureau } from '@/bureau/FlecheRetourBureau';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

/** Le bouton blanc de la maison, en haut à gauche d'un bâtiment de la ferme : il ramène à l'accueil (la carte). */
function BoutonAccueil() {
  const router = useRouter();
  return (
    <Pressable
      style={styles.accueil}
      onPress={() => router.replace('/')}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.navigation.layout.accueil}
      hitSlop={6}
    >
      <Ionicons name="home" size={24} color={colors.primary} />
    </Pressable>
  );
}

/** La flèche de retour du téléphone, quand l'en-tête de l'écran est refait à la main : elle revient à l'écran d'avant, ou à l'accueil. */
function FlecheRetour() {
  const router = useRouter();
  return (
    <Pressable
      style={commonStyles.boutonCompact}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.commun.general.retour}
    >
      <Ionicons name="arrow-back" size={24} color={colors.blanc} />
    </Pressable>
  );
}

/** La gauche de l'en-tête d'un bâtiment de la ferme (laiterie, abattoir, vétérinaire…) : le retour à l'accueil, puis la flèche de retour. */
export function EnteteBatiment(): ReactElement {
  return (
    <View style={styles.rangee}>
      <BoutonAccueil />
      {estBureau() ? <FlecheRetourBureau /> : <FlecheRetour />}
    </View>
  );
}

/** À donner à `headerLeft` des écrans des bâtiments de la ferme. */
export const enteteDuBatiment = (): (() => ReactElement) => EnteteBatiment;

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 4 },
  accueil: { width: 46, height: 38, borderRadius: 10, backgroundColor: colors.blanc, alignItems: 'center', justifyContent: 'center' },
});
