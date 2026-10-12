import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import ImpotsEntreprise from '@/features/entreprise/screens/ImpotsEntreprise';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { PucesActivite } from '@/features/comptabilite/components/PucesActivite';
import { useFiltreActivite } from '@/features/comptabilite/hooks/useFiltreActivite';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';

import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { calculerRecettesMicroBA, type RecettesMicroBA } from '@/features/comptabilite/services/fiscalite';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/comptabilite/FiscaliteImpots.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Impôts de l'élevage (micro-BA), ou, pour une entreprise, ses impôts selon son régime fiscal. */
export default function FiscaliteImpots() {
  return modeEntreprise() ? <ImpotsEntreprise /> : <ImpotsElevage />;
}

function ImpotsElevage() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [recettes, setRecettes] = useState<RecettesMicroBA | null>(null);
  // Tout par défaut : la déclaration porte sur l'ensemble des recettes.
  const [filtre, setFiltre] = useFiltreActivite();

  const charger = useCallback(async () => {
    const [toutesAnnees, r] = await Promise.all([
      toutesLesAnneesConnues(),
      calculerRecettesMicroBA(settings.anneeActive, filtre),
    ]);
    setAnnees(toutesAnnees);
    setRecettes(r);
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

      {recettes && (
        <Card>
          <Text style={commonStyles.cardTitle}>
            {TEXTES.comptabilite.fiscaliteImpots.recettesBrutesEspace}
            {settings.anneeActive}
          </Text>
          <Ligne
            label={TEXTES.comptabilite.fiscaliteImpots.ventesDeProductionLaitFromage}
            valeur={recettes.ventesProduits}
          />
          <Ligne
            label={TEXTES.comptabilite.fiscaliteImpots.aidesImposables}
            valeur={recettes.aidesImposables}
          />
          <Ligne
            label={TEXTES.comptabilite.fiscaliteImpots.autresFacturesEmises}
            valeur={recettes.autresRecettesImposables}
          />
          <View style={commonStyles.separateur} />
          <Ligne
            label={TEXTES.comptabilite.fiscaliteImpots.totalRecettesImposables}
            valeur={recettes.totalImposable}
            gras
          />
        </Card>
      )}

      {recettes && recettes.aidesParType.length > 0 && (
        <Card>
          <Text style={commonStyles.cardTitle}>
            {TEXTES.comptabilite.fiscaliteImpots.detailDesAidesParTypeEspace}
            {settings.anneeActive}
          </Text>
          <Text style={styles.info}>{TEXTES.comptabilite.fiscaliteImpots.leCaractereImposableEstCelui}</Text>
          {recettes.aidesParType.map((a) => (
            <View key={a.libelle} style={styles.aideBloc}>
              <Text style={styles.aideTitre}>{a.libelle}</Text>
              {a.imposable > 0 && (
                <Ligne label={TEXTES.comptabilite.fiscaliteImpots.imposable} valeur={a.imposable} />
              )}
              {a.nonImposable > 0 && (
                <Ligne label={TEXTES.comptabilite.fiscaliteImpots.nonImposable} valeur={a.nonImposable} />
              )}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.noticeExplicativeAVerifierAvant}</Text>
        <Text style={commonStyles.para}>{TEXTES.comptabilite.fiscaliteImpots.ceTotalAdditionnePourL}</Text>
        <Text style={commonStyles.para}>{TEXTES.comptabilite.fiscaliteImpots.celaCorrespondALaNotion}</Text>
        <Text style={commonStyles.paraGras}>{TEXTES.comptabilite.fiscaliteImpots.ceQueLAppNe}</Text>
        <Text style={commonStyles.para}>{TEXTES.comptabilite.fiscaliteImpots.leTauxDImpositionSaisi}</Text>
        <Text style={commonStyles.para}>
          {TEXTES.comptabilite.fiscaliteImpots.verifiezAussiLeCaractereImposable}
        </Text>
        <Text style={commonStyles.noteMarge}>
          {TEXTES.comptabilite.fiscaliteImpots.sourcesAConsulterEnCas}
        </Text>
      </Card>
    </Screen>
  );
}

function Ligne({ label, valeur, gras }: { label: string; valeur: number; gras?: boolean }) {
  return (
    <View style={commonStyles.rowBetweenTight}>
      <Text style={[styles.ligneLabel, gras && commonStyles.strongPrimary]}>{label}</Text>
      <Text style={[commonStyles.lineBold, gras && commonStyles.strongPrimary]}>{formatMontant(valeur)}</Text>
    </View>
  );
}
