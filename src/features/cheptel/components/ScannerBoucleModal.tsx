import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScannerBoucleCore } from '@/features/cheptel/components/ScannerBoucleCore';
import { styles } from '@/shared/styles/cheptel/ScannerBoucleModal.styles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  onClose: () => void;
  onDetected: (numero: string) => void;
  /** On scanne le numéro d'un lot : les phrases parlent de lot, pas de boucle. */
  lot?: boolean;
  /** Le bouton « Écrire le numéro » : ferme la photo et ouvre la saisie à la main. */
  onEcrire?: () => void;
}

export function ScannerBoucleModal({ visible, onClose, onDetected, lot, onEcrire }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScannerBoucleCore
          lot={lot}
          onDetected={(numero) => {
            onDetected(numero);
            onClose();
          }}
          texteSecondaire={TEXTES.commun.general.annuler}
          onSecondaire={onClose}
          onEcrire={onEcrire}
        />
      </SafeAreaView>
    </Modal>
  );
}
