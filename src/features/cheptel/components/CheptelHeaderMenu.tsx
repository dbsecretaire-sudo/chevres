import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/** Le bouton de l'en-tête du Cheptel : le bilan annuel (les exports du cheptel sont dans Organisation › PDF). */
export function CheptelHeaderMenu() {
  const router = useRouter();
  return (
    <Pressable
      style={commonStyles.boutonEnteteDroite}
      onPress={() => router.push(ROUTES.CHEPTEL_BILAN)}
      hitSlop={10}
      accessibilityLabel={TEXTES.commun.general.bilanAnnuel}
    >
      <Ionicons name="stats-chart" size={24} color={colors.blanc} />
    </Pressable>
  );
}
