import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';

interface Rubrique {
  libelle: string;
  aide: string;
  icone: keyof typeof Ionicons.glyphMap;
  route: string;
}

/** Ce qui reste hors des trois premiers onglets : la réglementation, l'argent, les partenaires, les bilans, l'historique et les réglages. */
const RUBRIQUES: Rubrique[] = [
  { libelle: 'Réglementation', aide: 'Cadre, étiquetage, agrément, analyses', icone: 'shield-checkmark-outline', route: ROUTES.CADRE_REGLEMENTAIRE_ATELIER },
  { libelle: 'Argent', aide: 'Factures, ventes, banque, assurance', icone: 'cash-outline', route: ROUTES.COMPTABILITE },
  { libelle: 'Ventes et contacts', aide: 'Chiffre d’affaires, tarifs, commandes, contacts', icone: 'cart-outline', route: ROUTES.COMMERCIAL },
  { libelle: 'Partenaires', aide: 'Abattoir, équarrissage, clients', icone: 'people-outline', route: '/commercial/partenaires' },
  { libelle: 'Bilans', aide: 'Bilan annuel, rentabilité, export', icone: 'stats-chart-outline', route: ROUTES.CHEPTEL_BILAN },
  { libelle: 'Historique', aide: 'Naissances, soins, lots, ventes', icone: 'time-outline', route: ROUTES.CHEPTEL_HISTORIQUE },
  { libelle: 'Réglages', aide: 'Année, établissement, sauvegarde', icone: 'settings-outline', route: ROUTES.REGLAGES },
];

/** La page « Plus » : les rubriques qui ne tiennent pas dans la barre du bas, plus l'accueil de la ferme et les rappels. */
export default function EcranPlus() {
  const router = useRouter();
  const ouvrir = (route: string) => router.push(route as never);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} style={{ backgroundColor: colors.background }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Plus</Text>
      {RUBRIQUES.map((r) => (
        <Pressable
          key={r.libelle}
          accessibilityRole="button"
          onPress={() => ouvrir(r.route)}
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
      <Pressable accessibilityRole="button" onPress={() => ouvrir('/')} style={{ marginTop: 10, alignItems: 'center', padding: 12 }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Accueil de la ferme</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => ouvrir(ROUTES.RAPPELS_HISTORIQUE)} style={{ alignItems: 'center', padding: 12 }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Rappels</Text>
      </Pressable>
    </ScrollView>
  );
}
