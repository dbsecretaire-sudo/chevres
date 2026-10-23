import { Children, isValidElement, useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { YearPicker } from '@/shared/components/YearPicker';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';

/**
 * Les choix du haut d'un écran (l'année, l'animal…) côte à côte, sur une ligne qui passe à la suivante s'il manque de la place. L'année
 * et l'animal sont dans la capsule du haut : une ligne qui n'avait que ceux-là ne laisse pas de vide sous le titre.
 */
export function LigneFiltres({ children }: PropsWithChildren) {
  const autres = Children.toArray(children).filter(
    (c) => !(isValidElement(c) && (c.type === YearPicker || c.type === SelecteurEspece)),
  );
  // Des choix qui ne montrent rien (l'année, les rubriques d'un gîte quand il n'y en a pas) ne laissent pas de vide sous le titre : tant que la ligne n'a pas de hauteur,
  // elle est hors de la page (posée à part, invisible) et ne prend aucune place.
  const [affichee, setAffichee] = useState(false);
  if (autres.length === 0) return null;
  return (
    <View
      style={affichee ? styles.ligne : { position: 'absolute', opacity: 0 }}
      onLayout={(e) => setAffichee(e.nativeEvent.layout.height > 0)}
    >
      {children}
    </View>
  );
}
