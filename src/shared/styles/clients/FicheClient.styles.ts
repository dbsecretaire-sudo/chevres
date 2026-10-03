import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  resumeBlocFromage: { gap: 4 },
  lienDetails: { fontSize: 13, fontWeight: '600', color: colors.ajout },
  resumeDetailBloc: { gap: 2, paddingLeft: 8, marginTop: 2 },
  resumeSeparateur: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  resumeTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  resumeTotalValeur: { fontSize: 16, fontWeight: '800', color: colors.primary },
  montantEcriture: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
