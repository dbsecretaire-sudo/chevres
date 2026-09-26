import { Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/** Flèche de retour d'en-tête qui remplace le "retour" par défaut (une étape en arrière dans la pile)
 *  par une destination fixe — utile quand un écran est atteint par plusieurs chemins mais doit toujours
 *  ramener au même endroit. */
export function HeaderBackTo({ to }: { to: Href }) {
  const router = useRouter();
  return (
    <Pressable style={styles.bouton} onPress={() => router.replace(to)}>
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { paddingHorizontal: 12, paddingVertical: 6 },
});
