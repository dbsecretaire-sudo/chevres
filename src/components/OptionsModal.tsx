import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
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
    padding: 10,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionText: { fontSize: 16, color: colors.text, fontWeight: '600' },
});
