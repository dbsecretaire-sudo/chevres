import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';

/** Les choix du haut d'un écran (l'année, l'animal…) côte à côte, sur une ligne qui passe à la suivante s'il manque de la place. */
export function LigneFiltres({ children }: PropsWithChildren) {
  return <View style={styles.ligne}>{children}</View>;
}
