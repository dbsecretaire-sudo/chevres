import { Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EspaceSansFleche, useFlecheMasquee } from '@/bureau/FlecheRetourBureau';
import { commonStyles } from '@/shared/styles/commonStyles';
import { afficheBureau } from '@/shared/utils/affichage';

/** Flèche de retour d'en-tête qui remplace le "retour" par défaut (une étape en arrière dans la pile)
 *  par une destination fixe (on y navigue : dans une barre d'onglets, c'est l'onglet qui change, sans remplacer l'écran quitté) — utile quand un écran est atteint par plusieurs chemins mais doit toujours
 *  ramener au même endroit. */
export function HeaderBackTo({ to, onBack }: { to: Href; onBack?: () => void }) {
  const router = useRouter();
  // Version Windows : pas de flèche pour un écran du menu de gauche ; ailleurs, la page cible se recharge (sans mémoire de la précédente).
  const masquee = useFlecheMasquee();
  if (masquee) return <EspaceSansFleche />;
  return (
    <Pressable
      style={commonStyles.boutonCompact}
      onPress={() => {
        onBack?.();
        if (afficheBureau()) router.replace(to);
        else router.navigate(to);
      }}
    >
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </Pressable>
  );
}
