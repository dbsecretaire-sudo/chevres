import { useCallback } from 'react';
import { Pressable } from 'react-native';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
  type Href,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StockFromagerie from '@/features/stock/screens/StockFromagerie';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/**
 * Le stock de l'exploitation (fromagerie, aliments). Ouvert depuis un
 * formulaire en cours (le crayon d'une liste de marchandises ou d'aliments), il montre une flèche de retour vers ce formulaire.
 */
export default function StockScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { retour } = useLocalSearchParams<{ retour?: string }>();

  // La flèche ne vaut que pour cette visite : en quittant le stock, l'adresse de retour est oubliée.
  useFocusEffect(
    useCallback(
      () => () => navigation.setParams({ retour: undefined, espece: undefined, onglet: undefined, vue: undefined } as never),
      [navigation],
    ),
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: retour
            ? () => (
                <Pressable style={commonStyles.boutonCompact} onPress={() => router.navigate(retour as Href)}>
                  <Ionicons name="arrow-back" size={24} color={colors.blanc} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <StockFromagerie />
    </>
  );
}
