import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  total: { fontSize: 16, fontWeight: '800', color: colors.text },

  /** Un ticket du bar : l'en-tête (nom, crayon, flèche), les boissons commandées et la ligne d'ajout. */
  enteteTicket: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  ticketTitre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nomTicket: { fontSize: 16, fontWeight: '800', color: colors.text },
  totalTicketReplie: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
});
