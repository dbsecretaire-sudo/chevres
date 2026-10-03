import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  totalCard: { alignItems: 'center', gap: 2 },
  totalValeur: { fontSize: 20, fontWeight: '800', color: colors.danger },
  montantEcriture: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
