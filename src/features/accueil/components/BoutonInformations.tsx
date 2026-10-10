import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/accueil/Accueil.styles';

/** Le bouton des informations de l'entreprise (ou de l'exploitation) : une puce blanche à côté de l'année, qui ouvre ses informations. */
export function BoutonInformations({ titre }: { titre: string }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.boutonInformations}
      onPress={() => router.push(ROUTES.INFORMATIONS_EXPLOITATION)}
    >
      <Text style={styles.boutonInformationsTexte} numberOfLines={1}>
        {titre}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}
