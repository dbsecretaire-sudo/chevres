import { Pressable } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/**
 * La flèche de retour d'une liste ouverte depuis un formulaire en cours (le crayon d'un fournisseur, d'un client…) : elle ramène à
 * ce formulaire, à l'adresse `retour`, et non à la page parente de la liste. Sans `retour`, l'en-tête garde sa flèche d'origine.
 */
export function FlecheRetourDepuis({ retour }: { retour?: string }) {
  const router = useRouter();
  if (!retour) return null;
  return (
    <Stack.Screen
      options={{
        headerLeft: () => (
          <Pressable style={commonStyles.boutonCompact} onPress={() => router.navigate(retour as Href)}>
            <Ionicons name="arrow-back" size={24} color={colors.blanc} />
          </Pressable>
        ),
      }}
    />
  );
}
