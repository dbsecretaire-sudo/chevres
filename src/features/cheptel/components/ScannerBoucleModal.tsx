import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScannerBoucleCore } from '@/features/cheptel/components/ScannerBoucleCore';
import { styles } from '@/shared/styles/cheptel/ScannerBoucleModal.styles';
import { TEXTES } from '@/shared/textes';

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
          texteSecondaire={TEXTES.commun.general.annuler}
          onSecondaire={onClose}
        />
      </SafeAreaView>
    </Modal>
  );
}
