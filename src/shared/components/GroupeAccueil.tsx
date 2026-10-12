import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/shared/styles/components/GroupeAccueil.styles';

/** Un groupe de l'accueil d'un onglet (Cheptel, Production, Comptabilité) : son titre en petites capitales, puis son bloc de lignes. */
export function GroupeAccueil({ titre, children }: PropsWithChildren<{ titre: string }>) {
  return (
    <View style={styles.groupe}>
      <Text style={styles.titre}>{titre}</Text>
      {children}
    </View>
  );
}
