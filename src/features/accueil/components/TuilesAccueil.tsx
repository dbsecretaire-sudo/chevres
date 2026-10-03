import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import type { StatsAccueil } from '@/features/accueil/services/statsAccueil';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { DECIMALES_QUANTITE_MAX, LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/accueil/Accueil.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const formatG = (g: number) =>
  `${g.toLocaleString(LOCALE, { maximumFractionDigits: DECIMALES_QUANTITE_MAX })} g`;

const pluriel = (n: number) => (n > 1 ? 's' : '');

interface TuileProps {
  route: Parameters<ReturnType<typeof useRouter>['push']>[0];
  children: React.ReactNode;
}

/** Carte cliquable de l'accueil qui ouvre l'écran correspondant. */
function Tuile({ route, children }: TuileProps) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [commonStyles.flex1, pressed && commonStyles.pressed]}
      onPress={() => router.push(route)}
    >
      <Card>{children}</Card>
    </Pressable>
  );
}

interface Props {
  stats: StatsAccueil | null;
  annee: number;
}

/** Les quatre tuiles de statistiques : animaux, cabris de l'année, alimentation, solde. */
export function TuilesAccueil({ stats, annee }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <Tuile route={ROUTES.CHEPTEL}>
          <Text style={styles.statValue}>{stats?.totalVivantes ?? '—'}</Text>
          <Text style={styles.statLabel}>{TEXTES.accueil.accueil.animauxVivants}</Text>
          <Text style={commonStyles.caption}>
            {stats
              ? TEXTES.accueil.accueil.chevresChevreValeurBoucsBouc(
                  stats.chevres,
                  pluriel(stats.chevres),
                  stats.boucs,
                  pluriel(stats.boucs),
                  stats.cabrits,
                  pluriel(stats.cabrits),
                )
              : ''}
          </Text>
        </Tuile>
        <Tuile route={ROUTES.CHEPTEL_BILAN}>
          <Text style={styles.statValue}>{stats?.cabritsAnnee ?? '—'}</Text>
          <Text style={styles.statLabel}>
            {TEXTES.commun.general.cabrisNesEnEspace}
            {annee}
          </Text>
        </Tuile>
      </View>

      <View style={commonStyles.row}>
        <Tuile route={ROUTES.EXPLOITATION_ALIMENTATION}>
          <Text style={styles.statValue}>
            {stats?.gParAnimalParJour !== undefined ? formatG(stats.gParAnimalParJour) : '—'}
          </Text>
          <Text style={styles.statLabel}>{TEXTES.accueil.accueil.dAlimentAnimalJour}</Text>
        </Tuile>
        <Tuile route={ROUTES.COMPTABILITE}>
          <Text
            style={[
              styles.statValue,
              { color: stats && stats.soldeFactures < 0 ? colors.danger : colors.primary },
            ]}
          >
            {stats ? formatMontant(stats.soldeFactures) : '—'}
          </Text>
          <Text style={styles.statLabel}>{TEXTES.accueil.accueil.soldeFacturesHorsAutre}</Text>
        </Tuile>
      </View>
    </>
  );
}
