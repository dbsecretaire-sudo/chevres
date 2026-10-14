import { View } from 'react-native';
import { styles } from '@/shared/styles/components/BarreHorizontale.styles';

export interface SegmentBarre {
  /** La part de la piste que prend ce segment (0 à 1). */
  part: number;
  couleur: string;
}

/**
 * Une barre horizontale faite de segments l'un derrière l'autre : de simples vues, sans bibliothèque. La piste entière vaut 1 ;
 * ce qui n'est pas couvert par un segment reste à la couleur du fond.
 */
export function BarreHorizontale({ segments }: { segments: SegmentBarre[] }) {
  return (
    <View style={styles.piste}>
      {segments.map((s, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { width: `${Math.max(0, Math.min(1, s.part)) * 100}%`, backgroundColor: s.couleur },
          ]}
        />
      ))}
    </View>
  );
}
