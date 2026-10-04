import { Text, View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { useFiscaliteEntreprise } from '@/features/entreprise/hooks/useFiscaliteEntreprise';
import { PARAMETRES_REGIME_MICRO } from '@/shared/constants/entreprise';
import { LABEL_REGIME_FISCAL } from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Impôts d'une entreprise : chiffre d'affaires de l'année et, pour un régime « micro », plafond et abattement. */
export default function ImpotsEntreprise() {
  const { annee, annees, setAnneeActive, fiscalite, infos } = useFiscaliteEntreprise();
  const T = TEXTES.entreprise.impots;
  const regime = infos?.regimeFiscal;
  const micro =
    regime && regime in PARAMETRES_REGIME_MICRO
      ? PARAMETRES_REGIME_MICRO[regime as keyof typeof PARAMETRES_REGIME_MICRO]
      : undefined;
  const caHt = fiscalite?.caHt ?? 0;

  return (
    <Screen>
      <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />

      <Card>
        <Text style={commonStyles.cardTitle}>{T.recettesTitre(annee)}</Text>
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.chiffreAffairesHt}</Text>
          <Text style={commonStyles.lineBold}>{formatMontant(caHt)}</Text>
        </View>
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.regime}</Text>
          <Text style={commonStyles.lineBold}>{regime ? LABEL_REGIME_FISCAL[regime] : '—'}</Text>
        </View>
        {!regime ? <Text style={commonStyles.note}>{T.nonRenseigne}</Text> : null}

        {micro ? (
          <>
            <View style={commonStyles.separateur} />
            <View style={styles.ligne}>
              <Text style={commonStyles.line}>{T.plafond}</Text>
              <Text style={commonStyles.lineBold}>{formatMontant(micro.plafond)}</Text>
            </View>
            <View style={styles.ligne}>
              <Text style={commonStyles.line}>{T.partDuPlafond}</Text>
              <Text style={commonStyles.lineBold}>{Math.round((caHt / micro.plafond) * 100)} %</Text>
            </View>
            <View style={styles.ligne}>
              <Text style={commonStyles.line}>{T.abattement(micro.abattement)}</Text>
              <Text style={commonStyles.lineBold}>{formatMontant((caHt * micro.abattement) / 100)}</Text>
            </View>
            <View style={styles.ligne}>
              <Text style={commonStyles.strongPrimary}>{T.beneficeEstime}</Text>
              <Text style={commonStyles.strongPrimary}>
                {formatMontant(caHt - (caHt * micro.abattement) / 100)}
              </Text>
            </View>
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.noticeTitre}</Text>
        <Text style={commonStyles.para}>{T.notice}</Text>
        <Text style={commonStyles.paraGras}>{T.noticeAvertissement}</Text>
      </Card>
    </Screen>
  );
}
