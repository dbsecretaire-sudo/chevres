import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/colors';
import { ROUTES } from '@/shared/constants/routes';

/** La hauteur des rubriques, sans compter la barre de navigation du téléphone : celle-ci reste sous la barre, jamais par-dessus. */
const HAUTEUR_RUBRIQUES = 64;

/** Les rubriques de la barre du bas (téléphone, mode avancé) : l'accueil, puis les quatre rubriques. Chacune garde sa page ; « Plus » regroupe le reste. */
const RUBRIQUES = [
  { route: 'index', libelle: 'Accueil', icone: (c: string) => <Ionicons name="home" size={24} color={c} /> },
  { route: 'cheptel', libelle: 'Ferme', icone: (c: string) => <Ionicons name="paw" size={24} color={c} /> },
  { route: 'contacts', libelle: 'Contacts', icone: (c: string) => <Ionicons name="people" size={24} color={c} /> },
  { route: 'comptabilite', libelle: 'Comptabilité', icone: (c: string) => <Ionicons name="calculator" size={24} color={c} /> },
  { route: 'plus', libelle: 'Plus', icone: (c: string) => <Ionicons name="menu" size={24} color={c} /> },
] as const;

/** La barre à quatre onglets du bas : la rubrique ouverte est en couleur. */
export function BarreQuatreRubriques({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  // La barre de navigation du système (retour, accueil, récents) occupe le bas de l'écran : les rubriques passent au-dessus.
  const { bottom } = useSafeAreaInsets();
  const ouvert = state.routes[state.index];
  // Une page de rubrique garde en couleur l'onglet d'où elle vient : « Plus » pour le menu, « Chèvres » pour le mouvement des chèvres.
  // La liste des contacts, ouverte dans la Comptabilité, est en couleur sous « Contacts ».
  const sousPage = ouvert?.state?.routes?.[ouvert.state.index ?? 0]?.name ?? '';
  const courant =
    ouvert?.name === 'rubrique/[nom]'
      ? (ouvert.params as { nom?: string } | undefined)?.nom === 'mouvement'
        ? 'cheptel'
        : 'plus'
      : ouvert?.name === 'comptabilite' && sousPage.startsWith('contacts')
        ? 'contacts'
        : ouvert?.name;
  return (
    <View
      style={{
        flexDirection: 'row',
        height: HAUTEUR_RUBRIQUES + bottom,
        paddingBottom: bottom,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      {RUBRIQUES.map((r) => {
        const actif = courant === r.route;
        const couleur = actif ? colors.primary : colors.textMuted;
        return (
          <Pressable
            key={r.route}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            // La Ferme a une pile de pages : un appui ramène à sa page racine, et non à la dernière page visitée (le stock, la grange…).
            // Un appui sur une rubrique ramène à sa page racine : un parcours entamé dans l'onglet est abandonné, la page d'accueil de l'onglet s'affiche.
            // Les Contacts ouvrent la liste des contacts, comme les tuiles qui y mènent : par son adresse.
            onPress={() => {
              if (r.route === 'cheptel' || r.route === 'comptabilite') navigation.navigate(r.route, { screen: 'index' });
              else if (r.route === 'contacts') router.navigate(ROUTES.CONTACTS as never);
              else navigation.navigate(r.route);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            {r.icone(couleur)}
            <Text style={{ fontSize: 11, fontWeight: '600', color: couleur }}>{r.libelle}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
