import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  /** Une section déroulée : un seul panneau vert clair, cerclé de vert, qui contient l'entête puis toutes ses sous-sections. */
  panneau: {
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 10,
  },
  /** L'entête d'une section déroulée : sans cadre ni fond propres, c'est celui du panneau. */
  enteteOuverte: { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 6, paddingVertical: 8 },
  titre: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
});
