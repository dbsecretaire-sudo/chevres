import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Apparition } from '@/features/accueil/ferme/animations';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.actions;

const ACTIONS: { cle: keyof typeof T; icone: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { cle: 'ecriture', icone: 'receipt', route: ROUTES.COMPTABILITE_NOUVELLE },
  { cle: 'naissance', icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE },
  { cle: 'traitement', icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENT_NOUVEAU },
  { cle: 'vente', icone: 'cash', route: `${ROUTES.COMPTABILITE_NOUVELLE}?type=emise&categorie=viande` },
];

/** Les actions de tous les jours, en bas de l'accueil comme le bouton « Niveau » d'un jeu : une écriture, une naissance, un traitement, une vente. */
export function ActionsFerme() {
  const router = useRouter();
  // Sans la barre d'icônes du bas, la barre d'actions touche le bord de l'écran : elle respecte la barre de navigation du système.
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.barre, { paddingBottom: 8 + bottom }]}>
      {ACTIONS.map((a, i) => (
        <Apparition key={a.cle} delai={300 + i * 80} style={styles.cellule}>
          <Pressable style={({ pressed }) => [styles.bouton, pressed && styles.appuye]} onPress={() => router.push(a.route as never)} accessibilityRole="button" accessibilityLabel={T[a.cle]}>
            <Ionicons name={a.icone} size={24} color={colors.blanc} />
            <Text style={styles.libelle} numberOfLines={1}>
              {T[a.cle]}
            </Text>
          </Pressable>
        </Apparition>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  cellule: { flex: 1 },
  bouton: { alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 10, borderWidth: 2, borderColor: colors.primaryDark },
  appuye: { opacity: 0.8 },
  libelle: { color: colors.blanc, fontSize: 13, fontWeight: '700' },
});
