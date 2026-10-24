import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** Le bas des pages ouvertes depuis le mode normal (le stock, les lots…) : un seul gros bouton « Retour », sans la navigation du mode avancé. */
export function BarreRetourSimple() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ padding: 12, paddingBottom: 12 + bottom, backgroundColor: colors.background }}>
      <Button
        label={TEXTES.roles.berger.retour}
        variant="secondary"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/berger' as never))}
      />
    </View>
  );
}
