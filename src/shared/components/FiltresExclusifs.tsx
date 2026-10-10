import { Pressable, Text, View } from 'react-native';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/FiltresExclusifs.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  choix: string[];
  /** Le choix actif (aucun : tout est montré). */
  valeur: string | null;
  onChoisir: (valeur: string | null) => void;
}

/** Des puces qui filtrent une liste : l'une ou l'autre, jamais plusieurs ; un second appui sur la puce active la désélectionne. */
export function FiltresExclusifs({ choix, valeur, onChoisir }: Props) {
  const accent = useAccentColor();
  return (
    <View style={styles.ligne}>
      {choix.map((c) => {
        const active = c === valeur;
        return (
          <Pressable
            key={c}
            style={[styles.puce, active && { backgroundColor: accent }]}
            onPress={() => onChoisir(active ? null : c)}
          >
            <Text style={[commonStyles.labelMuted, active && { color: colors.blanc }]}>{c}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
