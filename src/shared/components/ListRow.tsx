import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDansBloc } from '@/shared/components/BlocListe';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/ListRow.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  title: string;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Texte du titre en gris (une ligne inactive). */
  grise?: boolean;
  /** Met la ligne en évidence (la réservation qu'on est venu voir). */
  surlignee?: boolean;
  /** Une icône dans une pastille teintée à gauche, et une flèche à droite (les lignes d'un menu). */
  icone?: keyof typeof Ionicons.glyphMap;
}

export function ListRow({ title, subtitle, trailing, onPress, grise, surlignee, icone }: Props) {
  const dansBloc = useDansBloc();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowCard,
        dansBloc && styles.rowDansBloc,
        surlignee && styles.rowSurlignee,
        pressed && onPress ? commonStyles.pressed : null,
      ]}
    >
      {icone ? (
        <View style={styles.pastille}>
          <Ionicons name={icone} size={22} color={colors.primary} />
        </View>
      ) : null}
      <View style={commonStyles.textWrap}>
        <Text style={[styles.rowTitle, grise && styles.rowTitleGris]}>{title}</Text>
        {subtitle ? <Text style={commonStyles.muted}>{subtitle}</Text> : null}
      </View>
      {trailing ??
        (icone && onPress ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null)}
    </Pressable>
  );
}
