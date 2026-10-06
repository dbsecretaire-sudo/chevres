import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '@/shared/styles/components/ListRow.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  title: string;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Texte du titre en gris (une ligne inactive). */
  grise?: boolean;
}

export function ListRow({ title, subtitle, trailing, onPress, grise }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.rowCard, pressed && onPress ? commonStyles.pressed : null]}
    >
      <View style={commonStyles.textWrap}>
        <Text style={[styles.rowTitle, grise && styles.rowTitleGris]}>{title}</Text>
        {subtitle ? <Text style={commonStyles.muted}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </Pressable>
  );
}
