import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';

interface Props {
  libelle?: string;
  icone?: keyof typeof Ionicons.glyphMap;
  /** Une petite flèche après le mot : le bouton ouvre une liste. */
  liste?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  couleur?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/** Un bouton de la barre d'outils du poste de comptabilité : un rectangle fin, un mot (et son icône), sans capsule ni couleur d'aplat. */
export function BoutonPlat({ libelle, icone, liste = false, onPress, accessibilityLabel, couleur = colors.text, style, disabled }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.bouton, pressed && styles.appuye, disabled && styles.inactif, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? libelle}
    >
      {icone ? <Ionicons name={icone} size={15} color={couleur} /> : null}
      {libelle ? (
        <Text style={[styles.texte, { color: couleur }]} numberOfLines={1}>
          {libelle}
        </Text>
      ) : null}
      {liste ? <Ionicons name="chevron-down" size={12} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

/** Un séparateur vertical entre deux groupes de boutons. */
export const SeparateurDeBarre = () => <View style={styles.separateur} />;

const styles = StyleSheet.create({
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    backgroundColor: colors.blanc,
  },
  appuye: { backgroundColor: colors.badgeBg },
  inactif: { opacity: 0.5 },
  texte: { fontSize: 13, fontWeight: '600' },
  separateur: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: 4 },
});
