import type { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { styles } from '@/shared/styles/components/Card.styles';

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}
