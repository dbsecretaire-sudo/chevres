import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.bandeau;

interface Props {
  /** La balance de l'année : les recettes moins les dépenses. */
  balance?: number;
  /** Les boucles d'identification en stock, pas encore posées (la pastille de la boucle). */
  boucles?: number;
  /** Les petits nés dans l'année : le petit badge sur la pastille des boucles (ils sont bouclés à la naissance). */
  naissances?: number;
  /** Le stock d'aliment : les jours qu'il tient, à défaut les kilos. */
  aliments: { kg: number; jours?: number } | null;
}

/** Une pastille du bandeau : son icône, sa valeur, et un appui qui ouvre l'écran qui la détaille. */
function Pastille({ icone, valeur, couleur, badge, libelle, route }: { icone: keyof typeof Ionicons.glyphMap; valeur: string; couleur?: string; badge?: string; libelle: string; route: string }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.pastille}
      onPress={() => router.push(route as never)}
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
 * les boucles à poser (l'étiquette), l'aliment en stock (la pomme) et les réglages.
 */
export function BandeauFerme({ balance, boucles, naissances, aliments }: Props) {
  const router = useRouter();
  const peuDAliment = aliments?.jours !== undefined && aliments.jours <= 7;
  return (
    <View style={styles.bandeau}>
      <Pressable
        style={styles.portrait}
        onPress={() => router.push(ROUTES.INFORMATIONS_EXPLOITATION as never)}
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
      />
      <Pastille
        icone="pricetag"
        valeur={boucles === undefined ? '…' : String(boucles)}
        badge={naissances ? `+${naissances}` : undefined}
        couleur={colors.accent}
        libelle={T.boucles}
        route={ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES)}
      />
      <Pastille
        icone="nutrition"
        valeur={aliments ? (aliments.jours !== undefined ? `${aliments.jours} j` : `${Math.round(aliments.kg)} kg`) : '…'}
        couleur={peuDAliment ? colors.danger : undefined}
        libelle={T.aliments}
        route={`${ROUTES.COMPTABILITE_STOCKS}?onglet=aliments`}
      />
      <Pressable style={styles.reglages} onPress={() => router.push(ROUTES.REGLAGES as never)} accessibilityRole="button" accessibilityLabel={T.reglages}>
        <Ionicons name="settings-outline" size={22} color={colors.blanc} />
      </Pressable>
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
  portrait: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.blanc },
  pastille: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.blanc, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 6, minWidth: 0 },
  valeur: { fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1 },
  badge: { position: 'absolute', top: -6, right: -2, backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1 },
  badgeTexte: { color: colors.blanc, fontSize: 11, fontWeight: '700' },
  reglages: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
