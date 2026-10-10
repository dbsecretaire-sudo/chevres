import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { StatsAccueil } from '@/features/accueil/services/statsAccueil';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { DECIMALES_QUANTITE_MAX, LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { entrerAvecRetour } from '@/shared/navigation/contexteRetour';
import { styles } from '@/shared/styles/accueil/Accueil.styles';
import { TEXTES } from '@/shared/textes';

const formatG = (g: number) =>
  `${g.toLocaleString(LOCALE, { maximumFractionDigits: DECIMALES_QUANTITE_MAX })} g`;

interface StatProps {
  route: Parameters<ReturnType<typeof useRouter>['push']>[0];
  valeur: string;
  libelle: string;
  detail?: string;
  couleur?: string;
}

/** Un chiffre de l'accueil : son nom au-dessus, sa valeur en grand ; un appui ouvre l'écran qui le détaille. */
function Stat({ route, valeur, libelle, detail, couleur }: StatProps) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.stat, pressed && styles.statAppuyee]}
      onPress={() => {
        // L'alimentation est un écran de santé : sa flèche de retour ramène ici, à l'accueil.
        if (route === ROUTES.SANTE_ALIMENTATION) entrerAvecRetour('/');
        router.push(route);
      }}
    >
      <Text style={styles.statLibelle} numberOfLines={2}>
        {libelle}
      </Text>
      <Text style={[styles.statValue, couleur ? { color: couleur } : null]}>{valeur}</Text>
      {detail ? <Text style={styles.statDetail}>{detail}</Text> : null}
    </Pressable>
  );
}

interface Props {
  stats: StatsAccueil | null;
  annee: number;
}

/**
 * Les quatre chiffres de l'élevage (animaux, naissances de l'année, alimentation, solde) dans une seule carte, séparés par de
 * fines lignes : tous de la même taille, sans couleur sauf un solde négatif.
 */
export function TuilesAccueil({ stats, annee }: Props) {
  const T = TEXTES.accueil.accueil;
  return (
    <View style={styles.grille}>
      <View style={styles.rangee}>
        <Stat
          route={ROUTES.CHEPTEL_LISTE}
          libelle={T.animauxVivants}
          valeur={String(stats?.totalVivantes ?? '—')}
          detail={stats ? T.repartitionAnimaux(stats.chevres, stats.boucs, stats.cabrits) : undefined}
        />
        <View style={styles.separateurVertical} />
        <Stat
          route={ROUTES.CHEPTEL_BILAN}
          libelle={`${TEXTES.commun.general.cabrisNesEnEspace}${annee}`}
          valeur={String(stats?.cabritsAnnee ?? '—')}
        />
      </View>
      <View style={styles.separateurHorizontal} />
      <View style={styles.rangee}>
        <Stat
          route={ROUTES.SANTE_ALIMENTATION}
          libelle={T.dAlimentAnimalJour}
          valeur={stats?.gParAnimalParJour !== undefined ? formatG(stats.gParAnimalParJour) : '—'}
        />
        <View style={styles.separateurVertical} />
        <Stat
          route={ROUTES.COMPTABILITE}
          libelle={T.soldeFactures}
          valeur={stats ? formatMontant(stats.soldeFactures) : '—'}
          couleur={stats && stats.soldeFactures < 0 ? colors.danger : undefined}
        />
      </View>
    </View>
  );
}
