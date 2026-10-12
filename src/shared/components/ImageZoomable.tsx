import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { styles } from '@/shared/styles/components/ImageZoomable.styles';

/** Le facteur d'agrandissement de l'image une fois zoomée : elle déborde de l'écran et se fait défiler. */
const AGRANDISSEMENT = 2.4;

/** La place gardée en haut de l'écran plein écran, pour la croix de fermeture. */
const MARGE_HAUT = 56;

interface Props {
  source: ImageSourcePropType;
  /** Le rapport largeur / hauteur de l'image. */
  rapport: number;
}

/**
 * Une image en aperçu : un appui l'ouvre en plein écran, entière et adaptée à l'écran ; un appui sur elle la zoome (on la fait alors
 * défiler, et on la pince sur iOS), un second la remet à la taille de l'écran. La croix referme.
 */
export function ImageZoomable({ source, rapport }: Props) {
  const [ouverte, setOuverte] = useState(false);
  const [zoomee, setZoomee] = useState(false);
  const { width, height } = useWindowDimensions();
  /** L'image entière dans l'écran (sous la croix) : la plus grande taille qui y tient, à son rapport. */
  const largeurEcran = Math.min(width, (height - MARGE_HAUT) * rapport);
  const largeur = zoomee ? width * AGRANDISSEMENT : largeurEcran;
  const image = (
    <Pressable onPress={() => setZoomee((z) => !z)}>
      <Image source={source} style={{ width: largeur, height: largeur / rapport }} resizeMode="contain" />
    </Pressable>
  );

  const fermer = () => {
    setOuverte(false);
    setZoomee(false);
  };

  return (
    <>
      <Pressable onPress={() => setOuverte(true)} accessibilityLabel={TEXTES.commun.general.agrandirLImage}>
        {/* Le cadre prend la forme de l'image (son rapport), qui le remplit : une image locale a sinon sa hauteur d'origine. */}
        <View style={[styles.apercu, { aspectRatio: rapport }]}>
          <Image source={source} style={styles.remplit} resizeMode="contain" />
        </View>
        <View style={styles.loupe}>
          <Ionicons name="expand-outline" size={16} color={colors.blanc} />
        </View>
      </Pressable>
      <Modal visible={ouverte} animationType="fade" onRequestClose={fermer}>
        <View style={styles.fond}>
          {zoomee ? (
            <ScrollView horizontal maximumZoomScale={4} minimumZoomScale={1} showsHorizontalScrollIndicator>
              <ScrollView maximumZoomScale={4} minimumZoomScale={1}>
                {image}
              </ScrollView>
            </ScrollView>
          ) : (
            <View style={styles.centre}>{image}</View>
          )}
          <Pressable
            style={styles.fermer}
            onPress={fermer}
            hitSlop={12}
            accessibilityLabel={TEXTES.commun.general.fermer}
          >
            <Ionicons name="close" size={26} color={colors.blanc} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
