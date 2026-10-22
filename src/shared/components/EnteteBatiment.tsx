import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRetour } from '@/shared/navigation/origineRetour';
import { FlecheRetourBureau } from '@/bureau/FlecheRetourBureau';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { afficheBureau } from '@/shared/utils/affichage';

/** La flèche de retour du téléphone, quand l'en-tête de l'écran est refait à la main : elle revient à l'écran d'avant, ou à l'accueil. */
function FlecheRetour() {
  // Depuis un bouton de l'accueil, d'un intérieur ou de la grange, elle ramène à cet endroit ; sinon à l'écran d'avant, ou à l'accueil.
  const retour = useRetour();
  return (
    <Pressable
      style={commonStyles.boutonCompact}
      onPress={retour}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.commun.general.retour}
    >
      <Ionicons name="arrow-back" size={24} color={colors.blanc} />
    </Pressable>
  );
}

/** La gauche de l'en-tête d'un bâtiment de la ferme (laiterie, abattoir, vétérinaire…) : la flèche de retour ; la maison est dans le bandeau. */
export function EnteteBatiment(): ReactElement {
  return afficheBureau() ? <FlecheRetourBureau /> : <FlecheRetour />;
}

/** À donner à `headerLeft` des écrans des bâtiments de la ferme. */
export const enteteDuBatiment = (): (() => ReactElement) => EnteteBatiment;
