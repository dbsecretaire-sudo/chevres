import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { FeuilleRappels } from '@/features/accueil/ferme/FenetresFerme';
import { useBandeauFerme } from '@/features/accueil/ferme/useBandeauFerme';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

interface ParametresBouton {
  tintColor?: string;
  canGoBack?: boolean;
}

/** Ce que l'en-tête lit des options d'un écran (son titre, ses boutons, la couleur de sa barre) : celles de la navigation, sans en dépendre. */
export interface PropsEnTeteApplication {
  options: {
    title?: string;
    headerStyle?: unknown;
    headerLeft?: (parametres: ParametresBouton) => ReactNode;
    headerRight?: (parametres: ParametresBouton) => ReactNode;
  };
  /** Présent quand l'écran a un écran d'avant dans sa pile. */
  back?: unknown;
  navigation: { goBack: () => void };
}

/** La petite flèche de retour : elle revient à l'écran d'avant. */
function FlecheRetour({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={commonStyles.boutonCompact}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.commun.general.retour}
    >
      <Ionicons name="arrow-back" size={24} color={colors.blanc} />
    </Pressable>
  );
}

/**
 * L'en-tête de toutes les pages du téléphone : le bandeau de la ferme (la maison, la balance, les rappels), et dessous une barre étroite avec,
 * s'il y en a une, la flèche de retour, le titre de la page et ses boutons. La barre garde la couleur de l'écran (verte, ou bleue pendant un ajout).
 */
export function EnTeteApplication({ options, back, navigation }: PropsEnTeteApplication) {
  const { balance, rappels } = useBandeauFerme();
  // L'en-tête n'a plus de barre d'état sous lui : le bandeau commence sous l'encoche.
  const { top } = useSafeAreaInsets();
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const parametres: ParametresBouton = { tintColor: colors.blanc, canGoBack: !!back };
  // Un écran qui a sa propre flèche (retour vers un endroit précis) la garde ; sinon, la flèche de retour de la pile.
  const gauche = options.headerLeft ? (
    options.headerLeft(parametres)
  ) : back ? (
    <FlecheRetour onPress={navigation.goBack} />
  ) : null;
  const droite = options.headerRight ? options.headerRight(parametres) : null;
  const titre = typeof options.title === 'string' ? options.title : '';
  const couleur = (StyleSheet.flatten(options.headerStyle as StyleProp<ViewStyle>)?.backgroundColor ??
    colors.primary) as string;
  return (
    <View style={styles.fond}>
      <View style={[styles.haut, { paddingTop: 12 + top }]}>
        <BandeauFerme balance={balance} rappels={rappels} onRappels={() => setRappelsOuverts(true)} />
      </View>
      {gauche || droite || titre ? (
        <View style={[styles.barre, { backgroundColor: couleur }]}>
          {gauche}
          <Text style={styles.titre} numberOfLines={1}>
            {titre}
          </Text>
          {droite}
        </View>
      ) : null}
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: colors.background },
  haut: { paddingHorizontal: 12, paddingBottom: 8 },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  titre: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.blanc },
});
