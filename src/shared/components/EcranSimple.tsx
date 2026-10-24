import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';

/** Le cadre d'une page « simple » ouverte d'une tuile : le titre de la page, la couleur de la ferme et le fond de page. */
export function EcranSimple({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Stack.Screen options={{ title: titre }} />
      <View style={styles.page}>{children}</View>
    </AccentColorProvider>
  );
}
