import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import type { DocumentGdsDepose } from '@/features/settings/settings';
import { EXTENSIONS_IMAGE } from '@/shared/constants/fichiers';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/ModalListeValeurs.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.exploitation.listeVisites;
const D = TEXTES.gds.documents;

/**
 * Le rapport d'essais d'une visite : ses documents téléversés (images PNG/JPG ou PDF), qu'un appui ouvre, avec la poubelle qui retire un document, et « Ajouter un document »
 * pour en téléverser d'autres.
 */
export function ModalRapportEssais({
  visible,
  titre,
  documents,
  onOuvrir,
  onAjouter,
  onRetirer,
  onFermer,
}: {
  visible: boolean;
  titre: string;
  documents: readonly DocumentGdsDepose[];
  onOuvrir: (document: DocumentGdsDepose) => void;
  onAjouter: () => void;
  onRetirer: (document: DocumentGdsDepose) => void;
  onFermer: () => void;
}) {
  const [aRetirer, setARetirer] = useState<DocumentGdsDepose | null>(null);
  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
        <Pressable style={commonStyles.backdrop} onPress={onFermer}>
          <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={commonStyles.subheading}>{titre}</Text>
            <ScrollView style={styles.liste} contentContainerStyle={commonStyles.gap10}>
              {documents.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunDocument}</Text> : null}
              {documents.map((d) => (
                <View key={d.piece.id} style={commonStyles.rowFin}>
                  <Pressable style={[commonStyles.flex1, styles.lien]} onPress={() => onOuvrir(d)} accessibilityRole="button">
                    <Ionicons
                      name={EXTENSIONS_IMAGE.includes(d.piece.extension.toLowerCase()) ? 'image-outline' : 'document-text-outline'}
                      size={26}
                      color={colors.textMuted}
                    />
                    <Text style={commonStyles.lineSemiBold} numberOfLines={2}>
                      {d.piece.nom}
                    </Text>
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => setARetirer(d)} accessibilityLabel={D.retirer}>
                    <Ionicons name="trash" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <Button label={T.ajouterUnDocument} onPress={onAjouter} />
            <Button variant="secondary" label={TEXTES.commun.general.fermer} onPress={onFermer} />
          </Pressable>
        </Pressable>
      </Modal>
      <ConfirmModal
        visible={!!aRetirer}
        title={D.confirmerRetrait}
        message={D.messageRetrait}
        confirmLabel={D.retirer}
        onCancel={() => setARetirer(null)}
        onConfirm={() => {
          if (aRetirer) onRetirer(aRetirer);
          setARetirer(null);
        }}
      />
    </>
  );
}
