import { useRef, useState, type PropsWithChildren, type RefObject } from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/DefilementFleches.styles';

/** Écart (en pixels) en deçà duquel on considère être arrivé au bout du contenu. */
const TOLERANCE_BORD = 2;
/** Part de la largeur visible dont on avance quand on appuie sur une flèche. */
const PART_PAR_APPUI = 0.6;

interface Props {
  contentContainerStyle?: ViewStyle;
  /** Pour piloter le défilement depuis le parent (par exemple pour amener un élément dans la vue). */
  scrollRef?: RefObject<ScrollView | null>;
}

/**
 * Ligne qui défile horizontalement, avec une flèche à gauche et/ou à droite tant qu'il reste du contenu de ce
 * côté ; la flèche disparaît dès qu'on arrive au bout. Un appui sur la flèche fait défiler.
 */
export function DefilementFleches({ children, contentContainerStyle, scrollRef }: PropsWithChildren<Props>) {
  const interne = useRef<ScrollView>(null);
  const ref = scrollRef ?? interne;
  const [decalage, setDecalage] = useState(0);
  const [largeurVisible, setLargeurVisible] = useState(0);
  const [largeurContenu, setLargeurContenu] = useState(0);

  const aGauche = decalage > TOLERANCE_BORD;
  const aDroite = decalage + largeurVisible < largeurContenu - TOLERANCE_BORD;

  const avancer = (sens: 1 | -1) =>
    ref.current?.scrollTo({
      x: Math.max(0, decalage + sens * largeurVisible * PART_PAR_APPUI),
      animated: true,
    });

  return (
    <View style={styles.conteneur} onLayout={(e) => setLargeurVisible(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
        onScroll={(e) => setDecalage(e.nativeEvent.contentOffset.x)}
        onContentSizeChange={(largeur) => setLargeurContenu(largeur)}
      >
        {children}
      </ScrollView>
      {aGauche && (
        <Pressable style={[styles.fleche, styles.gauche]} onPress={() => avancer(-1)}>
          <Ionicons name="chevron-back" size={20} color={colors.primaryDark} />
        </Pressable>
      )}
      {aDroite && (
        <Pressable style={[styles.fleche, styles.droite]} onPress={() => avancer(1)}>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
        </Pressable>
      )}
    </View>
  );
}
