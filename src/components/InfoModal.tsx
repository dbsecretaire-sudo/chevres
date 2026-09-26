import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '@/theme/colors';

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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Button label="OK" onPress={onClose} />
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
});
