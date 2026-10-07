import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  total: { fontSize: 16, fontWeight: '800', color: colors.text },

  /** Un ticket du bar : l'en-tête (nom, crayon, flèche), les boissons commandées et la ligne d'ajout. */
  enteteTicket: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  ticketTitre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTicket: { marginLeft: 15 },
  nomTicket: { fontSize: 16, fontWeight: '800', color: colors.text },
  totalTicketReplie: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  ligneTicket: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2 },
  nomLigneTicket: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  quantiteLigneTicket: {
    minWidth: 28,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  ajoutTicket: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  quantiteAjout: { width: 84 },
  boutonOk: { alignItems: 'flex-end' },
  totalTicket: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'right' },
});
