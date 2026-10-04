import { Pressable, Text } from 'react-native';
import { Card } from '@/shared/components/Card';
import { styles } from '@/shared/styles/accueil/Accueil.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  valeur: string;
  label: string;
  /** Couleur du chiffre quand elle diffère du vert habituel (un solde négatif en rouge). */
  couleur?: string;
  onPress: () => void;
}

/** Carte cliquable de l'accueil : un chiffre, son nom, et l'écran qu'elle ouvre. */
export function TuileChiffre({ valeur, label, couleur, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [commonStyles.flex1, pressed && commonStyles.pressed]}
      onPress={onPress}
    >
      <Card>
        <Text style={[styles.statValue, couleur ? { color: couleur } : null]}>{valeur}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card>
    </Pressable>
  );
}
