import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Une catégorie de l'inventaire : un cadre, pour qu'on la distingue des autres. */
  cadre: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  entete: { backgroundColor: colors.badgeBg, paddingHorizontal: 12, paddingVertical: 8 },
  raccourcis: { flexDirection: 'row', gap: 20, paddingHorizontal: 12, paddingVertical: 8 },
  ligneTitres: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  titreColonne: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nom: { fontSize: 15, color: colors.text },
  /** Le nom de la liste prend la place qui reste ; les deux cases (vente, achat) ont chacune une colonne fixe. */
  colonneNom: { flex: 1 },
  colonneCase: { width: 64, alignItems: 'center' },
});
