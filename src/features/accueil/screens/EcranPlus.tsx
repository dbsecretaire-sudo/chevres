import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { RUBRIQUES_DU_PLUS } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';

/**
 * La page « Plus », comme sur la maquette : les rubriques qui ne tiennent pas dans la barre du bas (chacune ouvre sa page de liste), plus l'accueil de la ferme
 * et les rappels.
 */
export default function EcranPlus() {
  const router = useRouter();
  const ouvrir = (route: string) => router.push(route as never);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} style={{ backgroundColor: colors.background }}>
      {/* Le titre « Plus » est dans la capsule du haut ; la ligne ci-dessous dit ce que cette page regroupe. */}
      <Text style={{ color: colors.textMuted }}>Tout le reste de l’application</Text>
      {/* Comme sur la maquette : le mode avancé est affiché en tête de la page, avec le chemin pour le changer. */}
      <View style={{ alignSelf: 'flex-start', backgroundColor: colors.text, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
        <Text style={{ color: colors.blanc, fontSize: 13, fontWeight: '600' }}>Mode avancé activé · Réglages › Mode avancé</Text>
      </View>
      {RUBRIQUES_DU_PLUS.map((r) => (
        <Pressable
          key={r.cle}
          accessibilityRole="button"
          onPress={() => ouvrir(ROUTES.rubrique(r.cle))}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.badgeBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={r.icone} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{r.libelle}</Text>
            <Text style={{ color: colors.textMuted }}>{r.aide}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
