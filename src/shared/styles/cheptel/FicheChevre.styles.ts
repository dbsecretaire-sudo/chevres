import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  scrollContentFab: { paddingBottom: 160, gap: 12 },
  ongletsEtAjout: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badges: { flexDirection: 'row', gap: 6 },
  /** Le numéro de l'animal et, à sa gauche, sa tête sur une pastille à la couleur de sa catégorie. */
  titreEtTete: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tete: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  teteImage: { width: 42, height: 42 },
  entry: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4, gap: 2 },
});
