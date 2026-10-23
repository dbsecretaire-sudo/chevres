import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { texteDeBalance } from '@/features/comptabilite/services/balanceDesEcritures';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/GroupeAccueil.styles';

/** Un groupe de l'accueil d'un onglet (Cheptel, Production, Comptabilité) : son titre en petites capitales, puis son bloc de lignes. */
export function GroupeAccueil({ titre, balance, children }: PropsWithChildren<{ titre: string; balance?: number }>) {
  return (
    <View style={styles.groupe}>
      <View style={styles.ligneTitre}>
        <Text style={styles.titre}>{titre}</Text>
        {/* La balance des écritures du groupe, en chiffres seulement, sur la même ligne que le titre. */}
        {balance !== undefined ? (
          <Text style={[styles.balance, { color: balance < 0 ? colors.danger : colors.text }]}>{texteDeBalance(balance)}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
