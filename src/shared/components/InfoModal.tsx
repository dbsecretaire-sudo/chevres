import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
}

/**
 * Popup d'information simple (un seul bouton "OK"), pour les messages de validation.
 * Remplace Alert.alert — qui ne s'affiche pas de façon fiable sur web.
 */
export function InfoModal({ visible, title, message, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <View style={commonStyles.modalSheet}>
          <Text style={commonStyles.subheading}>{title}</Text>
          {message ? <Text style={commonStyles.message}>{message}</Text> : null}
          <Button label={TEXTES.commun.infoModal.ok} onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}
