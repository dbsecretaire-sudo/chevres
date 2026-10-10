import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Le cadre du tableau : un bloc blanc aux coins arrondis, dont la liste défile. */
  cadre: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  /** Le titre d'une colonne : un appui trie la liste d'après elle. */
  titreColonne: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  colonneNumero: { flex: 1 },
  colonneDate: { width: 104 },
  texteEntete: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  liste: { maxHeight: 280 },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  ligneSeparee: { borderTopWidth: 1, borderTopColor: colors.border },
  texteLigne: { fontSize: 14, color: colors.text },
  /** Une date de pose : en rouge, comme ce qui sort du stock. */
  datePose: { fontSize: 14, color: colors.danger },
  vide: { padding: 16, textAlign: 'center' },
  /** Le choix de l'article (boucles, boucles rouges) au-dessus du tableau. */
  choix: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
