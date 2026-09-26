import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScannerBoucleCore } from './ScannerBoucleCore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onDetected: (numero: string) => void;
}

export function ScannerBoucleModal({ visible, onClose, onDetected }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScannerBoucleCore
          onDetected={(numero) => {
            onDetected(numero);
            onClose();
          }}
          texteSecondaire="Annuler"
          onSecondaire={onClose}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
});
