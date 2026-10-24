import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import ChiffreAffaires from '@/features/entreprise/screens/ChiffreAffaires';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { PucesActivite } from '@/features/comptabilite/components/PucesActivite';
import { useFiltreActivite } from '@/features/comptabilite/hooks/useFiltreActivite';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';

import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { calculerRecettesMensuelles, type RecettesMois } from '@/features/comptabilite/services/fiscalite';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { NOMS_MOIS } from '@/shared/textes/libelles';

/** Déclaration RSA de l'élevage, ou, pour une entreprise, son chiffre d'affaires par mois (URSSAF). */
export default function FiscaliteRSA() {
  return modeEntreprise() ? <ChiffreAffaires /> : <RsaElevage />;
}

function RsaElevage() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [mois, setMois] = useState<RecettesMois[]>([]);
  // Tout par défaut : la déclaration porte sur l'ensemble des recettes.
  const [filtre, setFiltre] = useFiltreActivite();

  const charger = useCallback(async () => {
    const [toutesAnnees, m] = await Promise.all([
      toutesLesAnneesConnues(),
      calculerRecettesMensuelles(settings.anneeActive, filtre),
    ]);
    setAnnees(toutesAnnees);
    setMois(m);
  }, [settings.anneeActive, filtre]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={settings.anneeActive} onChange={setAnneeActive} />
        <PucesActivite valeur={filtre} onChange={setFiltre} />
      </LigneFiltres>
      {filtre !== TOUTES_ACTIVITES && (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.parActivite.noteDeclaration}</Text>
      )}

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
