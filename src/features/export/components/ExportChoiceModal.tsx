import { OptionsModal } from '@/shared/components/OptionsModal';
import { FORMAT_EXPORT, type FormatExport } from '@/shared/constants/export';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  onClose: () => void;
  titre: string;
  onChoisir: (format: FormatExport) => void;
}

/** Petit choix de format réutilisé partout où un rapport peut être exporté en PDF ou en Excel. */
export function ExportChoiceModal({ visible, onClose, titre, onChoisir }: Props) {
  return (
    <OptionsModal
      visible={visible}
      onClose={onClose}
      title={titre}
      options={[
        {
          label: TEXTES.export.exportChoiceModal.pdf,
          icon: 'document-text',
          onPress: () => onChoisir(FORMAT_EXPORT.PDF),
        },
        {
          label: TEXTES.export.exportChoiceModal.excelXlsx,
          icon: 'grid',
          onPress: () => onChoisir(FORMAT_EXPORT.XLSX),
        },
      ]}
    />
  );
}
