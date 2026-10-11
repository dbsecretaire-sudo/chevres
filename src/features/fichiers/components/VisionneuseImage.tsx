import { useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uriPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { DELAI_DOUBLE_APPUI_MS, NIVEAUX_ZOOM_IMAGE, ZOOM_DOUBLE_APPUI } from '@/shared/constants/fichiers';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/fichiers/Visionneuse.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.fichiers.visionneuse;

interface Props {
  piece: PieceJointe;
  visible: boolean;
  onFermer: () => void;
}

/**
 * Une image jointe en plein écran, avec un zoom : les boutons − et + changent l'agrandissement (le pourcentage le ramène à
 * l'écran), un double appui agrandit ou revient, et on fait défiler l'image agrandie dans les deux sens. Le zoom se fait sans
 * geste à deux doigts pour fonctionner partout, Android compris.
 */
export function VisionneuseImage({ piece, visible, onFermer }: Props) {
  /** La place de l'image (la zone sous l'en-tête), pour dimensionner l'image à l'écran avant tout agrandissement. */
  const [zone, setZone] = useState({ largeur: 0, hauteur: 0 });
  const [indice, setIndice] = useState(0);
  const dernierAppui = useRef(0);
  const zoom = NIVEAUX_ZOOM_IMAGE[indice];
  const plusProche = (valeur: number) =>
    NIVEAUX_ZOOM_IMAGE.reduce(
      (meilleur, n, i) =>
        Math.abs(n - valeur) < Math.abs(NIVEAUX_ZOOM_IMAGE[meilleur] - valeur) ? i : meilleur,
      0,
    );

  const fermer = () => {
    setIndice(0);
    onFermer();
  };
  const mesurer = (e: LayoutChangeEvent) =>
    setZone({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height });
  const appuyer = () => {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_DOUBLE_APPUI_MS)
      setIndice(indice === 0 ? plusProche(ZOOM_DOUBLE_APPUI) : 0);
    dernierAppui.current = maintenant;
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={fermer}>
      <SafeAreaView style={styles.ecran} edges={['top', 'bottom']}>
        <View style={styles.entete}>
          <Text style={styles.nom} numberOfLines={1}>
            {piece.nom}
          </Text>
          <View style={styles.zoom}>
            <Pressable
              onPress={() => setIndice(Math.max(0, indice - 1))}
              hitSlop={8}
              accessibilityLabel={T.zoomMoins}
            >
              <Ionicons name="remove-circle-outline" size={30} color={colors.blanc} />
            </Pressable>
            <Pressable onPress={() => setIndice(0)} hitSlop={8} accessibilityLabel={T.ajuster}>
              <Text style={styles.niveau}>{T.niveau(zoom)}</Text>
            </Pressable>
            <Pressable
              onPress={() => setIndice(Math.min(NIVEAUX_ZOOM_IMAGE.length - 1, indice + 1))}
              hitSlop={8}
              accessibilityLabel={T.zoomPlus}
            >
              <Ionicons name="add-circle-outline" size={30} color={colors.blanc} />
            </Pressable>
            <Pressable onPress={fermer} hitSlop={8} accessibilityLabel={T.fermer}>
              <Ionicons name="close" size={32} color={colors.blanc} />
            </Pressable>
          </View>
        </View>
        <View style={styles.zone} onLayout={mesurer}>
          {zone.largeur > 0 ? (
            <ScrollView horizontal contentContainerStyle={{ minWidth: zone.largeur }}>
              <ScrollView contentContainerStyle={{ minHeight: zone.hauteur, justifyContent: 'center' }}>
                <Pressable onPress={appuyer}>
                  <Image
                    source={{ uri: uriPiece(piece) }}
                    style={{ width: zone.largeur * zoom, height: zone.hauteur * zoom }}
                    resizeMode="contain"
                  />
                </Pressable>
              </ScrollView>
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
