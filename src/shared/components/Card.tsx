import type { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useDansBloc } from '@/shared/components/BlocListe';
import { styles } from '@/shared/styles/components/Card.styles';

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const dansBloc = useDansBloc();
  return <View style={[styles.card, dansBloc && styles.dansBloc, style]}>{children}</View>;
}
