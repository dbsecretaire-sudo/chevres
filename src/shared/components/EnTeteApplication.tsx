import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';
import { useOrigineRetour, useRetour } from '@/shared/navigation/origineRetour';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';
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
  /** L'écran ouvert : son nom (« index » : la page d'accueil d'un onglet, qui n'a pas de flèche de retour). */
  route?: { name?: string };
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
 * L'en-tête de toutes les pages. Sur le téléphone : la capsule du haut (année, espèce, didacticiel, menus), puis, sans seconde bulle, la ligne du
 * titre de la page avec sa flèche de retour et ses boutons (de la couleur de l'écran : verte, ou bleue pendant un ajout) ; le bandeau de la
 * ferme est en bas (`BarreDuBas`). Sous Windows : le bandeau en haut, et dessous la barre du titre.
 */
export function EnTeteApplication({ options, back, navigation, route }: PropsEnTeteApplication) {
  const router = useRouter();
  // La disposition « comptable » a sa barre d'outils au-dessus de tout : l'en-tête ne garde que la flèche, le titre et les boutons de l'écran, sur toute la largeur.
  const comptable = useDispositionComptable();
  const origine = useOrigineRetour();
  // Depuis un bouton, la flèche ramène à l'endroit du clic ; sinon à l'écran d'avant de la pile.
  const retour = useRetour(back ? navigation.goBack : undefined);
  // L'en-tête n'a plus de barre d'état sous lui : il commence sous l'encoche.
  const { top } = useSafeAreaInsets();
  // La page d'accueil d'un onglet (Cheptel, Production… ou l'Organisation) n'a pas de flèche : la barre du bas est sa navigation.
  const pageDOnglet = route?.name === 'index' || route?.name === 'reglages';
  const parametres: ParametresBouton = { tintColor: colors.blanc, canGoBack: !!back };
  // Un écran qui a sa propre flèche (retour vers un endroit précis) la garde ; sinon, la flèche de retour de la pile.
  const flecheDuHaut = options.headerLeft ? (
    options.headerLeft(parametres)
  ) : back || origine || (!pageDOnglet && router.canGoBack()) ? (
    <FlecheRetour onPress={retour} />
  ) : null;
  // Sur téléphone, la flèche de retour n'est plus en haut (hors d'atteinte du pouce) : elle est dans la barre du bas, à gauche de la maison (BandeauFerme). Le poste de comptabilité
  // (affichage sobre, grande fenêtre), qui n'a pas de barre du bas, garde la sienne ici.
  const gauche = comptable ? flecheDuHaut : null;
  const droite = options.headerRight ? options.headerRight(parametres) : null;
  const titre = typeof options.title === 'string' ? options.title : '';
  const couleur = (StyleSheet.flatten(options.headerStyle as StyleProp<ViewStyle>)?.backgroundColor ??
    colors.primary) as string;
  return (
    <View style={styles.fond}>
      {comptable ? null : (
        <View style={[styles.haut, { paddingTop: 12 + top }]}>
          <View style={colonneCentree}>
            <BarreHauteFerme />
          </View>
        </View>
      )}
      {gauche || droite || titre ? (
        // Le titre n'est pas une seconde bulle sous la capsule : le texte est posé sur la page, avec la flèche et les boutons de l'écran dans de
        // petites pastilles de sa couleur (téléphone comme Windows).
        // La colonne centrée (largeur maximale) est un conteneur à part : avec des marges sur elle-même, la flèche collait au bord de la fenêtre.
        <View style={comptable ? undefined : colonneCentree}>
          <View style={[styles.titreLibre, comptable && styles.titreComptable]}>
            {gauche ? <View style={[styles.pastilleBouton, { backgroundColor: couleur }]}>{gauche}</View> : null}
            {/* Un titre long (« Association et coopérative agricole ») passe sur deux lignes plutôt que d'être coupé. */}
            <Text style={[styles.titre, { color: couleur }]} numberOfLines={2}>
              {titre}
            </Text>
            {droite ? <View style={[styles.pastilleBouton, { backgroundColor: couleur }]}>{droite}</View> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: colors.background },
  haut: { paddingHorizontal: 12, paddingBottom: 8 },
  // Arrondie et détachée comme le bandeau du dessus : deux barres de même forme, jamais une pastille posée sur un bandeau droit.
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 48,
    borderRadius: 24,
  },
  titre: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.blanc },
  // Le titre sur la page (téléphone) : une ligne sans fond.
  titreLibre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // Comme les cartes de la page (16 de chaque côté).
    paddingHorizontal: 16,
    marginBottom: 2,
    minHeight: 44,
  },
  titreComptable: { paddingHorizontal: 20, paddingTop: 8 },
  pastilleBouton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 2,
    minHeight: 40,
  },
});
