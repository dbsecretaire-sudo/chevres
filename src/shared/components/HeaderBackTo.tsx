import { Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Flèche de retour d'en-tête qui remplace le "retour" par défaut (une étape en arrière dans la pile)
 *  par une destination fixe (on y navigue : dans une barre d'onglets, c'est l'onglet qui change, sans remplacer l'écran quitté) — utile quand un écran est atteint par plusieurs chemins mais doit toujours
 *  ramener au même endroit. */
export function HeaderBackTo({ to, onBack }: { to: Href; onBack?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      style={commonStyles.boutonCompact}
      onPress={() => {
        onBack?.();
        router.navigate(to);
      }}
    >
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </Pressable>
  );
}
