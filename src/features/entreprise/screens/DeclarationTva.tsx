import { Text, View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { useFiscaliteEntreprise } from '@/features/entreprise/hooks/useFiscaliteEntreprise';
import { REGIME_TVA_PAR_DEFAUT } from '@/shared/constants/entreprise';
import { LABEL_REGIME_TVA, NOMS_MOIS } from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** TVA collectée (sur les recettes) et déductible (sur les achats) de l'entreprise, mois par mois. */
export default function DeclarationTva() {
  const { annee, annees, setAnneeActive, fiscalite, infos } = useFiscaliteEntreprise();
  const T = TEXTES.entreprise.tva;

  if (!infos?.tvaApplicable) {
    return (
      <Screen>
        <Card>
          <Text style={commonStyles.para}>{T.nonAssujetti}</Text>
        </Card>
      </Screen>
    );
  }

  const solde = (fiscalite?.tvaCollectee ?? 0) - (fiscalite?.tvaDeductible ?? 0);

  return (
    <Screen>
      <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />

      <Card>
        <Text style={commonStyles.cardTitle}>{T.titreMois(annee)}</Text>
        <View style={styles.ligne}>
          <Text style={commonStyles.muted}>{T.regime}</Text>
          <Text style={commonStyles.mutedBold}>
            {LABEL_REGIME_TVA[infos.regimeTva ?? REGIME_TVA_PAR_DEFAUT]}
          </Text>
        </View>
        <View style={commonStyles.separateur} />
        {fiscalite?.mois.map((m) => (
          <View key={m.mois} style={styles.ligne}>
            <Text style={commonStyles.line}>{NOMS_MOIS[m.mois - 1]}</Text>
            <Text style={commonStyles.lineBold}>{formatMontant(m.tvaCollectee - m.tvaDeductible)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.total}</Text>
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.collectee}</Text>
          <Text style={[commonStyles.lineBold, { color: colors.primary }]}>
            {formatMontant(fiscalite?.tvaCollectee ?? 0)}
          </Text>
        </View>
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.deductible}</Text>
          <Text style={[commonStyles.lineBold, { color: colors.danger }]}>
            {formatMontant(fiscalite?.tvaDeductible ?? 0)}
          </Text>
        </View>
        <View style={commonStyles.separateur} />
        <View style={styles.ligne}>
          <Text style={commonStyles.strongPrimary}>{solde >= 0 ? T.solde : T.creditDeTva}</Text>
          <Text style={commonStyles.strongPrimary}>{formatMontant(Math.abs(solde))}</Text>
        </View>
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.noticeTitre}</Text>
        <Text style={commonStyles.para}>{T.notice}</Text>
      </Card>
    </Screen>
  );
}
