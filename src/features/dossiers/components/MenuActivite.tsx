import { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { colors } from '@/shared/theme/colors';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { TEXTES } from '@/shared/textes';

/** Menu burger de l'écran Activité : la liste des clients (la structure type des dossiers est dans les Réglages). */
export function MenuActivite() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const T = TEXTES.dossiers.explorateur;

  return (
    <>
      <Pressable style={styles.boutonEntete} onPress={() => setOuvert(true)} hitSlop={8}>
        <Ionicons name="menu" size={28} color={colors.blanc} />
      </Pressable>
      <OptionsModal
        visible={ouvert}
        onClose={() => setOuvert(false)}
        options={[{ label: T.menuClients, icon: 'people', onPress: () => router.push(ROUTES.CLIENTS) }]}
      />
    </>
  );
}
