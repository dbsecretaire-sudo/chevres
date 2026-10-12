import { Linking, Modal, Pressable, ScrollView, Text } from 'react-native';
import { ImageZoomable } from '@/shared/components/ImageZoomable';
import { Button } from '@/shared/components/Button';
import { IMAGE_AIDE, IMAGES_AIDES, LIEN_AIDE, URL_LIEN_AIDE } from '@/shared/constants/aides';
import { styles } from '@/shared/styles/components/ExplicationModal.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Un morceau de texte, ou un lien cliquable (son nom et le site où il mène). */
export type SegmentExplication =
  string | { libelle: string; lien: (typeof LIEN_AIDE)[keyof typeof LIEN_AIDE] };

/** Un bloc d'une explication : un paragraphe (texte et liens à la suite) ou une image. */
export type BlocExplication =
  { texte: readonly SegmentExplication[] } | { image: (typeof IMAGE_AIDE)[keyof typeof IMAGE_AIDE] };

/** Une explication : un simple texte, ou des blocs (paragraphes avec liens, images). */
export type Explication = string | readonly BlocExplication[];

interface Props {
  visible: boolean;
  titre: string;
  explication: readonly BlocExplication[];
  onClose: () => void;
}

/** La fenêtre d'une explication riche : des paragraphes dont les liens s'ouvrent d'un appui, et des images (un tableau d'un relevé…). */
export function ExplicationModal({ visible, titre, explication, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{titre}</Text>
          <ScrollView style={commonStyles.listeDeFenetre} contentContainerStyle={commonStyles.gap10}>
            {explication.map((bloc, i) =>
              'image' in bloc ? (
                <ImageZoomable
                  key={i}
                  source={IMAGES_AIDES[bloc.image].source}
                  rapport={IMAGES_AIDES[bloc.image].rapport}
                />
              ) : (
                <Text key={i} style={commonStyles.message}>
                  {bloc.texte.map((segment, j) =>
                    typeof segment === 'string' ? (
                      segment
                    ) : (
                      <Text
                        key={j}
                        style={styles.lien}
                        onPress={() => Linking.openURL(URL_LIEN_AIDE[segment.lien]).catch(() => undefined)}
                      >
                        {segment.libelle}
                      </Text>
                    ),
                  )}
                </Text>
              ),
            )}
          </ScrollView>
          <Button label={TEXTES.commun.infoModal.ok} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
