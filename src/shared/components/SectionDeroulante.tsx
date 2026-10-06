import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/SectionDeroulante.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  titre: string;
  /** Le nombre d'éléments qu'elle contient, affiché à côté du titre. */
  nombre?: number;
  ouverte: boolean;
  onBasculer: () => void;
  children: ReactNode;
}

/** Une section qui se déroule d'un appui sur son titre (fermée par défaut) : plusieurs peuvent être ouvertes en même temps. */
export function SectionDeroulante({ titre, nombre, ouverte, onBasculer, children }: Props) {
  return (
    <View style={commonStyles.gap10}>
      <Pressable style={styles.entete} onPress={onBasculer}>
        <Text style={commonStyles.cardTitle}>
          {titre}
          {nombre !== undefined ? ` (${nombre})` : ''}
        </Text>
        <Ionicons name={ouverte ? 'chevron-up' : 'chevron-down'} size={22} color={colors.primary} />
      </Pressable>
      {ouverte ? children : null}
    </View>
  );
}
