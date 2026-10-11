import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.noir },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  nom: { flex: 1, fontSize: 14, color: colors.blanc },
  zoom: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  niveau: { minWidth: 48, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.blanc },
  zone: { flex: 1 },
  /** Le coin de l'aperçu qui rappelle qu'un appui l'ouvre en plein écran. */
  coin: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.voile,
  },
});
