import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '@/theme/colors';

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
export function ConfirmModal({ visible, title, message, confirmLabel = 'Confirmer', onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <Button style={styles.flex1} variant="secondary" label="Annuler" onPress={onCancel} />
            <Button style={styles.flex1} variant="danger" label={confirmLabel} onPress={onConfirm} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  message: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
