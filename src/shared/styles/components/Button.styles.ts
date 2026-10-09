import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 13,
    minHeight: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 16, fontWeight: '700', color: colors.blanc, textAlign: 'center' },
  /** Un bouton secondaire : fond teinté et fin contour de la couleur d'accent. */
  secondaire: { borderWidth: 1 },
  /** Une action destructrice : fond blanc, contour et texte rouges (moins agressif qu'un aplat, mais sans ambiguïté). */
  danger: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.danger },
  texteDanger: { color: colors.danger },
  disabled: { opacity: 0.5 },
  pressedLight: { opacity: 0.85 },
});
