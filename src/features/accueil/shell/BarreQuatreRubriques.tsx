import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** Les quatre rubriques de la barre du bas (téléphone, mode avancé). Chacune garde sa page ; « Plus » regroupe le reste. */
const RUBRIQUES = [
  { route: 'cheptel', libelle: 'Chèvres', icone: (c: string) => <Ionicons name="paw" size={24} color={c} /> },
  { route: 'production', libelle: 'Atelier', icone: (c: string) => <MaterialCommunityIcons name="cheese" size={24} color={c} /> },
  { route: 'visites', libelle: 'Visites', icone: (c: string) => <Ionicons name="trail-sign" size={24} color={c} /> },
  { route: 'plus', libelle: 'Plus', icone: (c: string) => <Ionicons name="menu" size={24} color={c} /> },
] as const;

/** La barre à quatre onglets du bas : la rubrique ouverte est en couleur. */
export function BarreQuatreRubriques({ state, navigation }: BottomTabBarProps) {
  const ouvert = state.routes[state.index];
  // Une page de rubrique garde en couleur l'onglet d'où elle vient : « Plus » pour le menu, « Chèvres » pour le mouvement des chèvres.
  const courant =
    ouvert?.name === 'rubrique/[nom]'
      ? (ouvert.params as { nom?: string } | undefined)?.nom === 'mouvement'
        ? 'cheptel'
        : 'plus'
      : ouvert?.name;
  return (
    <View style={{ flexDirection: 'row', height: 64, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
      {RUBRIQUES.map((r) => {
        const actif = courant === r.route;
        const couleur = actif ? colors.primary : colors.textMuted;
        return (
          <Pressable
            key={r.route}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            onPress={() => navigation.navigate(r.route)}
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
