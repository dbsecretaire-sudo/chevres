import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** Un gros bouton de la barre du bas de l'accueil « ferme » : une icône au-dessus, son nom dessous. Les boutons de la barre se partagent la largeur. */
export function BoutonDeBarre({ icone, libelle, onPress }: { icone: ReactNode; libelle: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.bouton, pressed && styles.appuye]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={libelle}
    >
      {icone}
      <Text style={styles.libelle} numberOfLines={1}>
        {libelle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 10, borderWidth: 2, borderColor: colors.primaryDark },
  appuye: { opacity: 0.8 },
  libelle: { color: colors.blanc, fontSize: 13, fontWeight: '700' },
});
