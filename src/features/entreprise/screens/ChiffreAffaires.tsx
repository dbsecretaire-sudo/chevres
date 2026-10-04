import { Text, View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { useFiscaliteEntreprise } from '@/features/entreprise/hooks/useFiscaliteEntreprise';
import { formatMontant } from '@/shared/utils/dates';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Chiffre d'affaires hors taxes de l'entreprise, mois par mois (utile pour la déclaration à l'URSSAF). */
export default function ChiffreAffaires() {
  const { annee, annees, setAnneeActive, fiscalite } = useFiscaliteEntreprise();
  const T = TEXTES.entreprise.chiffreAffaires;

  return (
    <Screen>
      <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />

      <Card>
        <Text style={commonStyles.cardTitle}>{T.titreMois(annee)}</Text>
        <Text style={commonStyles.note}>{T.horsTaxes}</Text>
        {fiscalite?.mois.map((m) => (
          <View key={m.mois} style={styles.ligne}>
            <Text style={commonStyles.line}>{NOMS_MOIS[m.mois - 1]}</Text>
            <Text style={commonStyles.lineBold}>{formatMontant(m.caHt)}</Text>
          </View>
        ))}
        <View style={commonStyles.separateur} />
        <View style={styles.ligne}>
          <Text style={commonStyles.lineBold}>{T.total}</Text>
          <Text style={commonStyles.strongPrimary}>{formatMontant(fiscalite?.caHt ?? 0)}</Text>
        </View>
        {fiscalite && fiscalite.aides > 0 ? (
          <View style={styles.ligne}>
            <Text style={commonStyles.muted}>{T.aides}</Text>
            <Text style={commonStyles.mutedBold}>{formatMontant(fiscalite.aides)}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.noticeTitre}</Text>
        <Text style={commonStyles.para}>{T.notice}</Text>
        <Text style={commonStyles.noteMarge}>{T.noticeVerifier}</Text>
      </Card>
    </Screen>
  );
}
