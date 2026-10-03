import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';

import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { calculerRecettesMensuelles, type RecettesMois } from '@/features/comptabilite/services/fiscalite';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { NOMS_MOIS } from '@/shared/textes/libelles';

export default function FiscaliteRSA() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [mois, setMois] = useState<RecettesMois[]>([]);

  const charger = useCallback(async () => {
    const [toutesAnnees, m] = await Promise.all([
      toutesLesAnneesConnues(),
      calculerRecettesMensuelles(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setMois(m);
  }, [settings.anneeActive]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return (
    <Screen>
      <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />

      <Card>
        <Text style={commonStyles.cardTitle}>
          {TEXTES.comptabilite.fiscaliteRsa.recettesParMoisEspace}
          {settings.anneeActive}
        </Text>
        {mois.map((m) => (
          <View key={m.mois} style={styles.ligne}>
            <Text style={commonStyles.line}>{NOMS_MOIS[m.mois - 1]}</Text>
            <Text style={commonStyles.lineBold}>{formatMontant(m.total)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.noticeExplicativeAVerifierAvant}</Text>
        <Text style={commonStyles.para}>
          {TEXTES.comptabilite.fiscaliteRsa.chaqueLigneMensuelleAdditionneVos}
        </Text>
        <Text style={commonStyles.para}>
          {TEXTES.comptabilite.fiscaliteRsa.laDeclarationTrimestrielleDeRessources}
        </Text>
        <Text style={commonStyles.paraGras}>{TEXTES.comptabilite.fiscaliteRsa.ceQueLAppNe}</Text>
        <Text style={commonStyles.noteMarge}>{TEXTES.comptabilite.fiscaliteRsa.sourcesAConsulterEnCas}</Text>
      </Card>
    </Screen>
  );
}
