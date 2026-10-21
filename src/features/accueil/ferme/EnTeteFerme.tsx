import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';
import { FeuilleRappels } from '@/features/accueil/ferme/FenetresFerme';
import { estBureau } from '@/shared/utils/plateforme';

/**
 * Le bandeau habituel de l'accueil (la maison, la balance, les rappels, les réglages), pour un écran qui n'a pas d'en-tête de navigation
 * (la grange) : il lit lui-même la balance et le nombre de rappels, et ouvre la liste des rappels.
 */
export function EnTeteFerme() {
  // Sans en-tête, le contenu commence sous l'encoche et la barre d'état.
  const { top } = useSafeAreaInsets();
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  return (
    <>
      <View style={[styles.haut, estBureau() ? null : { paddingTop: 12 + top }]}>
        <View style={styles.colonne}>
          {/* Sur le téléphone, la capsule du haut (comme sur toutes les pages) ; sous Windows, le bandeau. */}
          {estBureau() ? <BandeauFerme onRappels={() => setRappelsOuverts(true)} /> : <BarreHauteFerme />}
        </View>
      </View>
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  haut: { paddingHorizontal: 12, paddingBottom: 8 },
  colonne: { width: '100%', maxWidth: 600, alignSelf: 'center' },
});
