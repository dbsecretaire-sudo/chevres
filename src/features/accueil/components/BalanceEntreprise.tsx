import { Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import type { BalanceMois } from '@/features/accueil/hooks/useAccueilEntreprise';
import type { SoldesTransactions } from '@/features/comptabilite/services/filtresTransactions';
import { colors } from '@/shared/theme/colors';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/accueil/Accueil.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  annee: number;
  balance: SoldesTransactions | null;
  parMois: BalanceMois[];
}

/** L'état des finances de l'année : solde, recettes et dépenses, puis la balance mois par mois. */
export function BalanceEntreprise({ annee, balance, parMois }: Props) {
  const T = TEXTES.entreprise.accueil.balance;
  const montant = (valeur?: number) => (valeur === undefined ? '—' : formatMontant(valeur));
  const couleurSolde = (valeur: number) => (valeur < 0 ? colors.danger : colors.primary);

  return (
    <>
      <Card>
        <Text style={styles.statLabel}>{T.solde(annee)}</Text>
        <Text style={[styles.statValue, { color: couleurSolde(balance?.balance ?? 0) }]}>
          {montant(balance?.balance)}
        </Text>
        <View style={commonStyles.rowBetween}>
          <View>
            <Text style={styles.statLabel}>{T.recettes}</Text>
            <Text style={[commonStyles.lineBold, { color: colors.primary }]}>
              {montant(balance?.totalRentrees)}
            </Text>
          </View>
          <View>
            <Text style={styles.statLabel}>{T.depenses}</Text>
            <Text style={[commonStyles.lineBold, { color: colors.danger }]}>
              {montant(balance?.totalDepenses)}
            </Text>
          </View>
        </View>
        <Text style={commonStyles.note}>{T.horsAutre}</Text>
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.parMois}</Text>
        {parMois.map((m) => (
          <View key={m.mois} style={commonStyles.rowBetween}>
            <Text style={commonStyles.line}>{NOMS_MOIS[m.mois - 1]}</Text>
            <Text style={[commonStyles.lineBold, { color: couleurSolde(m.solde) }]}>{montant(m.solde)}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}
