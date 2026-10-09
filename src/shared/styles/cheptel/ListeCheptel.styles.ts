import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  filtres: {
    flexDirection: 'row',
    rowGap: 0,
    columnGap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  /** Le choix de l'espèce : aligné sur le reste de la liste (mêmes marges que les autres onglets). */
  choixEspece: { paddingHorizontal: 16 },
  /** La recherche et le bouton « Filtrer » : une seule ligne. */
  rechercheLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  /** La fenêtre des filtres : elle défile quand il y en a beaucoup. */
  feuille: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 10, maxHeight: '85%' },
  feuilleContenu: { gap: 10 },
  titreFeuille: { fontSize: 16, fontWeight: '800', color: colors.text },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 160,
  },
  resultatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  effacerTexte: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
