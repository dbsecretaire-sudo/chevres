import type { ReactNode } from 'react';
import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { filDeLaPage, pageDuMenuRetenue, retenirPageDuMenu } from '@/shared/navigation/filAriane';
import { publierTitre } from '@/shared/navigation/titreDeLaPage';
import { usePositionDansLesMenus } from '@/shared/navigation/usePositionDansLesMenus';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';

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

/**
 * L'en-tête de toutes les pages. Sur le téléphone : la capsule du haut (année, espèce, didacticiel, menus), puis, sans seconde bulle, la ligne du
 * titre de la page avec sa flèche de retour et ses boutons (de la couleur de l'écran : verte, ou bleue pendant un ajout) ; le bandeau de la
 * ferme est en bas (`BarreDuBas`). Sous Windows : le bandeau en haut, et dessous la barre du titre.
 */
export function EnTeteApplication({ options, back, navigation, route }: PropsEnTeteApplication) {
  // La disposition « comptable » a sa barre d'outils au-dessus de tout : l'en-tête ne garde que la flèche, le titre et les boutons de l'écran, sur toute la largeur.
  const comptable = useDispositionComptable();
  const router = useRouter();
  // Le fil d'Ariane (« Atelier > Gestion > Réserver > Nouvelle commande ») : chaque étape ramène à sa page.
  const { menus, courante, adresse } = usePositionDansLesMenus();
  useEffect(() => retenirPageDuMenu(courante), [courante]);
  // L'en-tête n'a plus de barre d'état sous lui : il commence sous l'encoche.
  const { top } = useSafeAreaInsets();
  const parametres: ParametresBouton = { tintColor: colors.blanc, canGoBack: !!back };
  // Pas de flèche de retour ici : sur téléphone elle est dans la barre du bas (BandeauFerme), et le poste de comptabilité (affichage sobre) n'en a pas.
  const droite = options.headerRight ? options.headerRight(parametres) : null;
  const titre = typeof options.title === 'string' ? options.title : '';
  const fil = comptable ? filDeLaPage(menus, courante, pageDuMenuRetenue(), titre) : [];
  // Le fil d'Ariane du bas (téléphone) ne voit pas l'écran : l'en-tête de la page affichée lui donne son titre.
  useFocusEffect(useCallback(() => publierTitre(titre, adresse), [titre, adresse]));
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
      {droite || titre ? (
        // Le titre n'est pas une seconde bulle sous la capsule : le texte est posé sur la page, avec la flèche et les boutons de l'écran dans de
        // petites pastilles de sa couleur (téléphone comme Windows).
        // La colonne centrée (largeur maximale) est un conteneur à part : avec des marges sur elle-même, la flèche collait au bord de la fenêtre.
        <View style={comptable ? undefined : colonneCentree}>
          <View style={[styles.titreLibre, comptable && styles.titreComptable]}>
            {/* Un titre long (« Association et coopérative agricole ») passe sur deux lignes plutôt que d'être coupé. */}
            <Text style={[styles.titre, { color: couleur }]} numberOfLines={2}>
              {fil.length > 1
                ? fil.map((maillon, i) => (
                    <Text key={`${i}-${maillon.libelle}`}>
                      {i > 0 ? <Text style={styles.separateur}>{' > '}</Text> : null}
                      {maillon.route ? (
                        <Text style={styles.etape} onPress={() => router.push(maillon.route as never)} accessibilityRole="link">
                          {maillon.libelle}
                        </Text>
                      ) : (
                        maillon.libelle
                      )}
                    </Text>
                  ))
                : titre}
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
  // Une étape du fil d'Ariane : grise, on la reconnaît à la main qui apparaît au survol ; la page ouverte, elle, garde la couleur de l'écran.
  etape: { color: colors.textMuted, cursor: 'pointer' } as never,
  separateur: { color: colors.textMuted, fontWeight: '400' },
  titreComptable: { paddingHorizontal: 20, paddingTop: 8 },
  pastilleBouton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 2,
    minHeight: 40,
  },
});
