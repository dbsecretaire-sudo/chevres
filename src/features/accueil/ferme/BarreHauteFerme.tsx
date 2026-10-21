import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { SelecteursFerme } from '@/features/accueil/ferme/SelecteursFerme';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { PastilleMenus } from '@/shared/components/PastilleMenus';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { colors } from '@/shared/theme/colors';

/**
 * La capsule du haut de toutes les pages du téléphone : l'année, l'espèce, le didacticiel et « Menus », qui déroule les rubriques (Cheptel,
 * Production, Commercial, Comptabilité, Organisation). On les touche moins que le bandeau du bas (la maison, la balance, les rappels) : ils sont
 * dans la zone du haut, que le pouce atteint le moins bien.
 */
export function BarreHauteFerme() {
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  // Les années connues, relues à chaque retour sur l'écran.
  useFocusEffect(
    useCallback(() => {
      toutesLesAnneesConnues()
        .then(setAnnees)
        .catch(() => undefined);
    }, []),
  );
  return (
    <View style={styles.barre}>
      <SelecteursFerme
        annees={annees}
        annee={settings.anneeActive}
        onChoisirAnnee={setAnneeActive}
        tout={!!settings.toutesAnnees}
        onChoisirTout={choisirToutesAnnees}
        forme="pastille"
      />
      <BoutonDidacticiel forme="pastille" />
      <PastilleMenus />
    </View>
  );
}

const styles = StyleSheet.create({
  // La même capsule verte que le bandeau du bas, avec ses pastilles blanches.
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    padding: 6,
  },
});
