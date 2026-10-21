import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';

/**
 * Le bandeau habituel de l'accueil (la maison, la balance, les rappels, les réglages), pour un écran qui n'a pas d'en-tête de navigation
 * (la grange) : il lit lui-même la balance et le nombre de rappels, et ouvre la liste des rappels.
 */
export function EnTeteFerme() {
  // Sans en-tête, le contenu commence sous l'encoche et la barre d'état.
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.haut, { paddingTop: 12 + top }]}>
      <View style={styles.colonne}>
        {/* La capsule du haut, comme sur toutes les pages (téléphone et Windows). */}
        <BarreHauteFerme />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  haut: { paddingHorizontal: 12, paddingBottom: 8 },
  colonne: { width: '100%', maxWidth: 600, alignSelf: 'center' },
});
