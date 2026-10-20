import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Apparition, Balade, Pulsation } from '@/features/accueil/ferme/animations';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import type { Chevre } from '@/features/cheptel/types';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.chevrerie;

/** Au-delà de ce nombre de jours d'aliment, la barre d'un animal est pleine. */
const JOURS_BARRE_PLEINE = 30;
/** En dessous de ce nombre de jours, l'aliment manque : la barre est rouge et la bulle du foin pulse. */
const JOURS_ALERTE = 7;

interface Props {
  /** Les animaux qui représentent le troupeau (jusqu'à quatre). */
  vedettes: readonly Chevre[];
  /** Le stock d'aliment : les jours qu'il tient, à défaut les kilos. */
  aliments: { kg: number; jours?: number } | null;
  onSortir: () => void;
  /** Les boutons de l'exploitation (estive, vétérinaire, équarrissage, organismes, rappels) et ce que fait un appui sur l'un d'eux. */
  boutons: readonly EntreeDeColonne[];
  onAppuiBouton: (cle: string, ancre: AncreBouton) => void;
}

/** La barre d'un animal : ce qu'il lui reste à manger (en jours d'aliment du stock), verte, orange, rouge. */
function Barre({ jours }: { jours?: number }) {
  const ratio = jours === undefined ? 0.5 : Math.min(1, Math.max(0.05, jours / JOURS_BARRE_PLEINE));
  const couleur =
    jours !== undefined && jours <= JOURS_ALERTE
      ? colors.danger
      : ratio < 0.5
        ? colors.accent
        : colors.success;
  return (
    <View style={styles.barre}>
      <View
        style={[styles.barreRemplie, { width: `${Math.round(ratio * 100)}%`, backgroundColor: couleur }]}
      />
    </View>
  );
}

/**
 * L'intérieur de la chèvrerie : un autre décor, la paille et le bois, où chaque animal a sa mangeoire. En haut, les boutons de ce qui se fait au
 * sein de l'exploitation (estive, soins, équarrissage, organismes, rappels). Sur chaque mangeoire, une bulle de foin dit ce qu'il reste ; la
 * barre de l'animal se vide quand le stock baisse, et la bulle pulse quand il manque.
 */
export function ChevrerieInterieure({ vedettes, aliments, onSortir, boutons, onAppuiBouton }: Props) {
  const router = useRouter();
  const jours = aliments?.jours;
  const manque = jours !== undefined && jours <= JOURS_ALERTE;
  return (
    <View style={styles.fond}>
      <View style={styles.mur} />
      <View style={styles.tete}>
        <Pressable
          style={styles.sortir}
          onPress={onSortir}
          accessibilityRole="button"
          accessibilityLabel={T.sortir}
        >
          <Text style={styles.sortirEmoji}>🚪</Text>
          <Text style={styles.sortirTexte}>{T.sortir}</Text>
        </Pressable>
        <Text style={styles.titre}>{T.titre}</Text>
      </View>

      {/* Ce qui se fait au sein de l'exploitation : l'estive, les soins, l'équarrissage, les organismes, les rappels. */}
      <View style={styles.boutons}>
        <ColonneFerme entrees={boutons} onAppui={onAppuiBouton} grille />
      </View>

      {vedettes.length === 0 ? (
        <Text style={styles.vide}>{TEXTES.accueil.ferme.zones.aucunAnimal}</Text>
      ) : (
        <View style={styles.stalles}>
          {vedettes.map((a, i) => (
            <Apparition key={a.id} delai={i * 120} style={styles.stalle}>
              <View style={styles.bulleFoin}>
                <Pulsation actif={manque}>
                  <Text style={styles.bulleFoinTexte}>
                    {jours !== undefined ? `🌾 ${T.jours(jours)}` : '🌾'}
                  </Text>
                </Pulsation>
              </View>
              <Barre jours={jours} />
              <Balade amplitude={4} duree={2200 + i * 500}>
                <Text style={styles.chevre}>🐐</Text>
              </Balade>
              {a.numeroBoucle?.trim() ? (
                <View style={styles.etiquette}>
                  <Text style={styles.etiquetteTexte}>{a.numeroBoucle.trim().slice(-5)}</Text>
                </View>
              ) : null}
              <View style={styles.mangeoire}>
                <Text style={styles.mangeoireFoin}>🌾🌾</Text>
              </View>
            </Apparition>
          ))}
        </View>
      )}

      <Pressable
        style={styles.donner}
        onPress={() => router.push(ROUTES.SANTE_ALIMENTATION as never)}
        accessibilityRole="button"
        accessibilityLabel={T.donner}
      >
        <Ionicons name="nutrition" size={22} color={colors.blanc} />
        <Text style={styles.donnerTexte}>{T.donner}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: '#E9D8A6',
    paddingTop: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 10,
  },
  mur: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 290,
    backgroundColor: '#B98A5B',
    borderBottomWidth: 6,
    borderBottomColor: '#8A6238',
  },
  tete: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#8A6238',
  },
  sortirEmoji: { fontSize: 20 },
  sortirTexte: { fontSize: 13, fontWeight: '700', color: colors.text },
  titre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.blanc,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 3,
    textAlign: 'right',
    flexShrink: 1,
  },
  boutons: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 16, padding: 6 },
  vide: { fontSize: 14, color: colors.textMuted, marginTop: 40 },
  stalles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 6 },
  stalle: { width: 110, alignItems: 'center', gap: 3 },
  bulleFoin: {
    backgroundColor: colors.blanc,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bulleFoinTexte: { fontSize: 12, fontWeight: '700', color: colors.text },
  barre: {
    width: 74,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#3C2F1E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3C2F1E',
  },
  barreRemplie: { height: '100%' },
  chevre: { fontSize: 46 },
  etiquette: {
    backgroundColor: '#F2C94C',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#B58B1A',
  },
  etiquetteTexte: { fontSize: 11, fontWeight: '700', color: '#4A3A07' },
  mangeoire: {
    width: 100,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#9C6B3C',
    borderWidth: 3,
    borderColor: '#6F4A25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mangeoireFoin: { fontSize: 18, marginTop: -8 },
  donner: {
    marginTop: 'auto',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: colors.blanc,
  },
  donnerTexte: { color: colors.blanc, fontSize: 15, fontWeight: '700' },
});
