import type { ComponentProps } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { LISTE_DEROULANTE } from '@/shared/utils/listeDeroulante';
import { styles } from '@/shared/styles/components/OptionsModal.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

export interface Option {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  /** Couleur de l'icône — colors.primary (vert) par défaut. */
  color?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: Option[];
}

/** Petit menu centré à options (icône + libellé), réutilisé par le FAB et les menus d'en-tête. */
export function OptionsModal({ visible, onClose, title, options }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <View style={styles.sheet} {...LISTE_DEROULANTE}>
          {title ? <Text style={styles.modalTitle}>{title}</Text> : null}
          {options.map((o) => (
            <Pressable
              key={o.label}
              style={styles.option}
              onPress={() => {
                onClose();
                o.onPress();
              }}
            >
              <Ionicons name={o.icon} size={20} color={o.color ?? colors.primary} />
              <Text style={styles.optionText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
