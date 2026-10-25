import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';

interface Entree {
  libelle: string;
  aide: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
}

/** L'accueil du tourisme : les visites de la ferme, les formules et l'accueil du public. */
const ENTREES: Entree[] = [
  { libelle: 'Nouvelle visite', aide: 'Date, personnes, formule', icone: 'add-circle-outline', route: ROUTES.COMMERCIAL_VISITE },
  { libelle: 'Formules', aide: 'Visite, dégustation, repas à la ferme', icone: 'restaurant-outline', route: ROUTES.COMMERCIAL_FORMULES },
  { libelle: 'Accueil du public', aide: 'Obligations et informations', icone: 'information-circle-outline', route: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC },
  { libelle: 'Agritourisme', aide: 'Recettes et charges de l’activité', icone: 'leaf-outline', route: ROUTES.COMMERCIAL_AGRITOURISME },
];

/** La rubrique Visites : le tourisme de la ferme, séparé des ventes et des contacts (dans « Plus »). */
export default function EcranVisites() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} style={{ backgroundColor: colors.background }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Visites</Text>
      {ENTREES.map((e) => (
        <Pressable
          key={e.libelle}
          accessibilityRole="button"
          onPress={() => router.push(e.route as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.badgeBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={e.icone} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{e.libelle}</Text>
            <Text style={{ color: colors.textMuted }}>{e.aide}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
