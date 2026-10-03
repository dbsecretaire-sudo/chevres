import { Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Flèche de retour d'en-tête qui remplace le "retour" par défaut (une étape en arrière dans la pile)
 *  par une destination fixe — utile quand un écran est atteint par plusieurs chemins mais doit toujours
 *  ramener au même endroit. */
export function HeaderBackTo({ to }: { to: Href }) {
  const router = useRouter();
  return (
    <Pressable style={commonStyles.boutonCompact} onPress={() => router.replace(to)}>
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </Pressable>
  );
}
