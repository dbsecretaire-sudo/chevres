import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Boîte de dialogue de confirmation façon popup, pour les actions destructrices.
 * Remplace Alert.alert — dont la version à plusieurs boutons ne s'affiche pas sur web.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = TEXTES.commun.general.confirmer,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={commonStyles.backdrop} onPress={onCancel}>
        <View style={commonStyles.modalSheet}>
          <Text style={commonStyles.subheading}>{title}</Text>
          <Text style={commonStyles.message}>{message}</Text>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onCancel}
            />
            <Button style={commonStyles.flex1} variant="danger" label={confirmLabel} onPress={onConfirm} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
