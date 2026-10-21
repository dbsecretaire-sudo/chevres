import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBandeauFerme } from '@/features/accueil/ferme/useBandeauFerme';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { effacerOrigine } from '@/shared/navigation/origineRetour';
import { colors } from '@/shared/theme/colors';
import { useEchelle } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.bandeau;

interface Props {
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
  grand = false,
  echelle,
}: {
  /** Le rapport à la taille d'un téléphone (`useEchelle`) : les icônes et le texte suivent la taille de l'écran. */
  echelle: number;
  icone: keyof typeof Ionicons.glyphMap;
  valeur: string;
  couleur?: string;
  badge?: string;
  libelle: string;
  /** L'écran que la pastille ouvre ; ou `onAppui`, pour une fenêtre de l'accueil. */
  route?: string;
  onAppui?: () => void;
  poids?: number;
  /** Le nombre en grand (les rappels) ; sinon, la taille habituelle (la balance, les boucles). */
  grand?: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={[styles.pastille, { flex: poids, paddingVertical: Math.round(8 * echelle) }]}
      onPress={() => (onAppui ? onAppui() : router.push(route as never))}
      accessibilityRole="button"
      accessibilityLabel={`${libelle} : ${valeur}`}
    >
      <Ionicons name={icone} size={Math.round((grand ? 22 : 20) * echelle)} color={couleur ?? colors.primary} />
      <Text
        style={[styles.valeur, { fontSize: Math.round((grand ? 19 : 14) * echelle) }, couleur ? { color: couleur } : null]}
        numberOfLines={1}
      >
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
/**
 * Le bandeau du haut de la ferme, présent sur toutes les pages : la maison (l'accueil), la balance de l'année (deux places), les boucles posées et les
 * tiptag (une place) et les rappels (une place). Il lit lui-même ses chiffres.
 */
export function BandeauFerme({ onRappels }: Props) {
  const router = useRouter();
  const { balance, boucles, rappels } = useBandeauFerme();
  const echelle = useEchelle();
  const tailleMaison = Math.round(42 * echelle);
  return (
    <View style={styles.bandeau}>
      <Pressable
        style={[styles.portrait, { width: tailleMaison, height: tailleMaison, borderRadius: tailleMaison / 2 }]}
        onPress={() => {
          effacerOrigine();
          router.navigate(ROUTES.accueilFerme() as never);
        }}
        accessibilityRole="button"
        accessibilityLabel={T.portrait}
      >
        <Ionicons name="home" size={Math.round(22 * echelle)} color={colors.blanc} />
      </Pressable>
      <Pastille
        icone="cash-outline"
        valeur={balance === undefined ? '…' : montant(balance)}
        // Le solde se lit à sa couleur : vert quand il est positif, rouge quand il est négatif.
        couleur={balance === undefined || balance === 0 ? undefined : balance < 0 ? colors.danger : colors.success}
        libelle={T.balance}
        route={ROUTES.COMPTABILITE_LISTE}
        poids={2}
        echelle={echelle}
      />
      <Pastille
        icone="pricetag"
        valeur={boucles === undefined ? '…' : String(boucles.boucles)}
        badge={boucles?.tiptag ? `+${boucles.tiptag}` : undefined}
        couleur={colors.accent}
        libelle={T.boucles}
        route={ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES)}
        echelle={echelle}
      />
      <Pastille
        icone="notifications"
        valeur={rappels === undefined ? '…' : String(rappels)}
        // La cloche est rouge quand des rappels attendent.
        couleur={rappels ? colors.danger : undefined}
        grand
        libelle={T.rappels}
        onAppui={onRappels}
        echelle={echelle}
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
