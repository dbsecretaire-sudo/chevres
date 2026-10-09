import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * Sur le web, `Alert.alert` de React Native n'affiche rien : un message d'erreur ou une confirmation n'y apparaissait jamais.
 * Cette installation le remplace par la boîte du navigateur : un simple message, ou une confirmation quand des boutons sont
 * proposés (le bouton qui n'est pas « annuler » est alors déclenché si l'utilisateur confirme).
 */
export function installerAlerteWeb(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  Alert.alert = (titre: string, message?: string, boutons?: AlertButton[]) => {
    const texte = [titre, message].filter(Boolean).join('\n\n');
    if (!boutons || boutons.length < 2) {
      window.alert(texte);
      boutons?.[0]?.onPress?.();
      return;
    }
    const action = boutons.find((b) => b.style !== 'cancel');
    if (window.confirm(texte)) action?.onPress?.();
    else boutons.find((b) => b.style === 'cancel')?.onPress?.();
  };
}
