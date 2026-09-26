import { OptionsModal } from './OptionsModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  titre: string;
  onChoisir: (format: 'pdf' | 'xlsx') => void;
}

/** Petit choix de format réutilisé partout où un rapport peut être exporté en PDF ou en Excel. */
export function ExportChoiceModal({ visible, onClose, titre, onChoisir }: Props) {
  return (
    <OptionsModal
      visible={visible}
      onClose={onClose}
      title={titre}
      options={[
        { label: 'PDF', icon: 'document-text', onPress: () => onChoisir('pdf') },
        { label: 'Excel (.xlsx)', icon: 'grid', onPress: () => onChoisir('xlsx') },
      ]}
    />
  );
}
