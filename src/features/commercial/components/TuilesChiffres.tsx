import { Pressable, Text, View } from 'react-native';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/commercial/Commercial.styles';

export interface TuileChiffre {
  cle: string;
  libelle: string;
  valeur: string;
  /** Vrai : le chiffre demande de l'attention (il se met en rouge). */
  alerte?: boolean;
  /** Au clic, ouvre l'écran qui détaille ce chiffre. */
  onPress?: () => void;
}

/** Les chiffres clés d'un écran, côte à côte : le libellé en petit, la valeur en gros. */
export function TuilesChiffres({ tuiles }: { tuiles: TuileChiffre[] }) {
  return (
    <View style={styles.tuiles}>
      {tuiles.map((t) => {
        const contenu = (
          <>
            <Text style={commonStyles.muted}>{t.libelle}</Text>
            <Text style={[styles.tuileValeur, t.alerte ? styles.tuileValeurAlerte : null]}>{t.valeur}</Text>
          </>
        );
        const style = [styles.tuile, t.alerte ? styles.tuileAlerte : null];
        return t.onPress ? (
          <Pressable key={t.cle} style={style} onPress={t.onPress} accessibilityRole="link" accessibilityLabel={t.libelle}>
            {contenu}
          </Pressable>
        ) : (
          <View key={t.cle} style={style}>
            {contenu}
          </View>
        );
      })}
    </View>
  );
}
