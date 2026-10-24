
import { Pressable, Text } from 'react-native';
import { styles } from '@/shared/styles/accueil/Accueil.styles';

interface Props {
  valeur: string;
  label: string;
  /** Couleur du chiffre quand elle diffère de la couleur du texte (un solde négatif en rouge). */
  couleur?: string;
  onPress: () => void;
}

/** Un chiffre de l'accueil : son nom au-dessus, sa valeur en grand ; un appui ouvre l'écran qui le détaille. */
export function TuileChiffre({ valeur, label, couleur, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.stat, pressed && styles.statAppuyee]} onPress={onPress}>
      <Text style={styles.statLibelle}>{label}</Text>
      <Text style={[styles.statValue, couleur ? { color: couleur } : null]}>{valeur}</Text>
    </Pressable>
  );
}
