import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/** Le bouton de l'en-tête de Comptabilité : la fiscalité (le détail par catégorie est le lien « Détails » du solde). */
export function ComptabiliteHeaderMenu() {
  const router = useRouter();
  return (
    <Pressable
      style={commonStyles.boutonEnteteDroite}
      onPress={() => router.push(ROUTES.FISCALITE)}
      hitSlop={10}
      accessibilityLabel={TEXTES.comptabilite.fiscalite.titre}
    >
      <Ionicons name="receipt" size={24} color={colors.blanc} />
    </Pressable>
  );
}
