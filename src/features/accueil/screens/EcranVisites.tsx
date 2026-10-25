import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';

interface Tuile {
  libelle: string;
  aide: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
  /** L'action principale : la tuile est remplie en vert, comme sur la maquette. */
  principale?: boolean;
}

/** L'accueil du tourisme, en tuiles comme sur la maquette : la visite à créer d'abord, puis les visites du jour, les formules et les tarifs. */
const TUILES: Tuile[] = [
  { libelle: 'Nouvelle visite', aide: 'Date, personnes, formule', icone: 'add', route: ROUTES.COMMERCIAL_VISITE, principale: true },
  { libelle: 'Aujourd’hui', aide: 'Visites du jour', icone: 'calendar-outline', route: ROUTES.COMMERCIAL_AGRITOURISME },
  { libelle: 'Repas', aide: 'Formules et réservations', icone: 'restaurant-outline', route: ROUTES.COMMERCIAL_FORMULES },
  { libelle: 'Tarifs', aide: 'Prix des formules', icone: 'pricetag-outline', route: ROUTES.COMMERCIAL_TARIFS },
  { libelle: 'Accueil du public', aide: 'Obligations et informations', icone: 'information-circle-outline', route: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC },
];

/** La rubrique Visites : le tourisme de la ferme, séparé des ventes et des contacts (dans « Plus »). */
export default function EcranVisites() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: colors.background }}>
      <View>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Visites</Text>
        <Text style={{ color: colors.textMuted }}>Agritourisme</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {TUILES.map((t) => {
          const principale = t.principale === true;
          return (
            <Pressable
              key={t.libelle}
              accessibilityRole="button"
              onPress={() => router.push(t.route as never)}
              style={{
                width: '48%',
                minHeight: 150,
                justifyContent: 'space-between',
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: principale ? colors.primary : colors.border,
                backgroundColor: principale ? colors.primary : colors.surface,
              }}
            >
              <Ionicons name={t.icone} size={28} color={principale ? colors.blanc : colors.primary} />
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: principale ? colors.blanc : colors.text }}>{t.libelle}</Text>
                <Text style={{ fontSize: 13, color: principale ? colors.blanc : colors.textMuted }}>{t.aide}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
