import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.bandeau;

interface Props {
  /** La balance de l'année : les recettes moins les dépenses. */
  balance?: number;
  /** Combien de rappels attendent d'être validés. */
  rappels?: number;
  /** Un appui sur la cloche : ouvre la liste des rappels. */
  onRappels: () => void;
}

/** Une pastille du bandeau : son icône, sa valeur, et un appui qui ouvre l'écran qui la détaille. */
/** `poids` : sa part de la largeur du bandeau (la balance, plus large, en prend deux fois plus que les boucles). */
function Pastille({
  icone,
  valeur,
  couleur,
  badge,
  libelle,
  route,
  onAppui,
  poids = 1,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  valeur: string;
  couleur?: string;
  badge?: string;
  libelle: string;
  /** L'écran que la pastille ouvre ; ou `onAppui`, pour une fenêtre de l'accueil. */
  route?: string;
  onAppui?: () => void;
  poids?: number;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={[styles.pastille, { flex: poids }]}
      onPress={() => (onAppui ? onAppui() : router.push(route as never))}
      accessibilityRole="button"
      accessibilityLabel={`${libelle} : ${valeur}`}
    >
      <Ionicons name={icone} size={20} color={couleur ?? colors.primary} />
      <Text style={[styles.valeur, couleur ? { color: couleur } : null]} numberOfLines={1}>
        {valeur}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTexte}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const montant = (valeur: number) => `${Math.round(valeur).toLocaleString(LOCALE)} €`;

/**
 * Le bandeau du haut de l'accueil, comme le tableau de bord d'un jeu : le portrait de l'exploitation, la balance de l'année (les pièces),
 * les rappels à valider et les réglages.
 */
export function BandeauFerme({ balance, rappels, onRappels }: Props) {
  const router = useRouter();
  return (
    <View style={styles.bandeau}>
      <Pressable
        style={styles.portrait}
        onPress={() => router.navigate(ROUTES.accueilFerme() as never)}
        accessibilityRole="button"
        accessibilityLabel={T.portrait}
      >
        <Ionicons name="home" size={22} color={colors.blanc} />
      </Pressable>
      <Pastille
        icone="cash-outline"
        valeur={balance === undefined ? '…' : montant(balance)}
        couleur={balance !== undefined && balance < 0 ? colors.danger : undefined}
        libelle={T.balance}
        route={ROUTES.COMPTABILITE_LISTE}
        poids={2}
      />
      <Pastille
        icone="notifications"
        valeur={rappels === undefined ? '…' : String(rappels)}
        couleur={rappels ? colors.accent : undefined}
        libelle={T.rappels}
        onAppui={onRappels}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  portrait: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.blanc,
  },
  pastille: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minWidth: 0,
  },
  valeur: { fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -2,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeTexte: { color: colors.blanc, fontSize: 11, fontWeight: '700' },
});
