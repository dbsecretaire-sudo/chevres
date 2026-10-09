import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/SectionDeroulante.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  titre: string;
  /** Le nombre d'éléments qu'elle contient, affiché à côté du titre. */
  nombre?: number;
  ouverte: boolean;
  onBasculer: () => void;
  /** Vrai quand quelque chose, dans la section, demande l'attention : une pastille rouge « ! » s'affiche sur son titre. */
  alerte?: boolean;
  children: ReactNode;
}

/** Une section qui se déroule d'un appui sur son titre : plusieurs peuvent être ouvertes en même temps. */
export function SectionDeroulante({ titre, nombre, ouverte, onBasculer, alerte, children }: Props) {
  return (
    <View style={[commonStyles.gap10, ouverte && styles.panneau]}>
      <Pressable style={[styles.entete, ouverte && styles.enteteOuverte]} onPress={onBasculer}>
        <Text style={styles.titre}>
          {titre}
          {nombre !== undefined ? ` (${nombre})` : ''}
        </Text>
        {alerte ? <PastilleAlerte /> : null}
        <Ionicons name={ouverte ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </Pressable>
      {ouverte ? children : null}
    </View>
  );
}
