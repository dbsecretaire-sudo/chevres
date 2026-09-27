import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { BoucleField } from '@/components/BoucleField';
import { DateField } from '@/components/DateField';
import { SelectField } from '@/components/SelectField';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { colors } from '@/theme/colors';
import { enregistrerNaissance, numeroBoucleExiste } from '@/storage/repositories';
import { currentYear, todayISO } from '@/utils/dates';
import { generateId } from '@/utils/id';
import { useAjoutTabBarBleu } from '@/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/theme/AccentColorContext';
import type { Sexe } from '@/types/models';

interface CabritForm {
  key: string;
  numeroBoucle: string;
  sexe: Sexe;
  nom: string;
  mortNe: boolean;
  renouvellement: boolean;
  renouvellementAnnee: string;
}

function nouveauCabrit(): CabritForm {
  return {
    key: generateId(),
    numeroBoucle: '',
    sexe: 'F',
    nom: '',
    mortNe: false,
    renouvellement: false,
    renouvellementAnnee: String(currentYear()),
  };
}

function cabritsInitiaux(sexes?: string): CabritForm[] {
  if (!sexes) return [nouveauCabrit()];
  const liste = sexes
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Sexe => s === 'F' || s === 'M');
  if (liste.length === 0) return [nouveauCabrit()];
  return liste.map((sexe) => ({ ...nouveauCabrit(), sexe }));
}

export default function NouvelleNaissance() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const params = useLocalSearchParams<{ mereNumeroBoucle?: string; sexes?: string }>();
  const [date, setDate] = useState(todayISO());
  const [mereNumeroBoucle, setMereNumeroBoucle] = useState(params.mereNumeroBoucle ?? '');
  const [notes, setNotes] = useState('');
  const [cabrits, setCabrits] = useState<CabritForm[]>(cabritsInitiaux(params.sexes));
  const [enregistrement, setEnregistrement] = useState(false);

  const majCabrit = (key: string, patch: Partial<CabritForm>) => {
    setCabrits((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const supprimerCabrit = (key: string) => {
    setCabrits((prev) => (prev.length > 1 ? prev.filter((c) => c.key !== key) : prev));
  };

  const enregistrer = async () => {
    if (!mereNumeroBoucle.trim()) {
      Alert.alert('Mère requise', "Merci de renseigner le n° de boucle de la mère.");
      return;
    }

    const bouclesCabrits = cabrits.map((c) => c.numeroBoucle.trim()).filter((b) => b.length > 0);
    const doublonLocal = bouclesCabrits.find((b, i) => bouclesCabrits.indexOf(b) !== i);
    if (doublonLocal) {
      Alert.alert('N° de boucle en double', `Le n° ${doublonLocal} est utilisé plusieurs fois dans ce formulaire.`);
      return;
    }

    setEnregistrement(true);
    try {
      for (const boucle of bouclesCabrits) {
        if (await numeroBoucleExiste(boucle)) {
          Alert.alert('N° de boucle déjà utilisé', `Le n° ${boucle} est déjà attribué à une autre chèvre.`);
          return;
        }
      }

      await enregistrerNaissance({
        date,
        mereNumeroBoucle: mereNumeroBoucle.trim(),
        cabrits: cabrits.map((c) => ({
          numeroBoucle: c.numeroBoucle.trim() || undefined,
          sexe: c.sexe,
          nom: c.nom.trim() || undefined,
          mortNe: c.mortNe,
          renouvellement: c.renouvellement,
          renouvellementAnnee: c.renouvellement ? Number(c.renouvellementAnnee) || currentYear() : undefined,
        })),
        notes: notes.trim() || undefined,
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
    <Screen>
      <DateField label="Date de la mise bas" required value={date} onChange={setDate} />
      <BoucleField
        label="N° de boucle de la mère"
        required
        value={mereNumeroBoucle}
        onChangeText={setMereNumeroBoucle}
        placeholder="ex: FR12345678"
      />

      <Text style={styles.sectionTitle}>Cabrits ({cabrits.length})</Text>
      {cabrits.map((cabrit, index) => (
        <Card key={cabrit.key} style={styles.cabritCard}>
          <View style={styles.cabritHeader}>
            <Text style={styles.cabritTitle}>Cabrit {index + 1}</Text>
            {cabrits.length > 1 && (
              <Button label="Retirer" variant="danger" onPress={() => supprimerCabrit(cabrit.key)} />
            )}
          </View>
          <BoucleField
            label="N° de boucle"
            value={cabrit.numeroBoucle}
            onChangeText={(v) => majCabrit(cabrit.key, { numeroBoucle: v })}
            placeholder="Facultatif avant 6 mois"
          />
          <SelectField
            label="Sexe"
            required
            value={cabrit.sexe}
            onChange={(v) => majCabrit(cabrit.key, { sexe: v })}
            options={[
              { value: 'F', label: 'Femelle' },
              { value: 'M', label: 'Mâle' },
            ]}
          />
          <FormField
            label="Nom"
            value={cabrit.nom}
            onChangeText={(v) => majCabrit(cabrit.key, { nom: v })}
            placeholder="Facultatif"
          />
          <View style={styles.checkboxes}>
            <Checkbox
              label="Désigné(e) pour le renouvellement"
              value={cabrit.renouvellement}
              onChange={(v) => majCabrit(cabrit.key, { renouvellement: v })}
            />
            {cabrit.renouvellement && (
              <FormField
                label="Année de désignation"
                value={cabrit.renouvellementAnnee}
                onChangeText={(v) => majCabrit(cabrit.key, { renouvellementAnnee: v })}
                keyboardType="number-pad"
                placeholder={String(currentYear())}
              />
            )}
            <Checkbox
              label="Mort-né"
              value={cabrit.mortNe}
              onChange={(v) => majCabrit(cabrit.key, { mortNe: v })}
              activeColor={colors.danger}
            />
          </View>
        </Card>
      ))}

      <Button
        label="+ Ajouter un cabrit"
        variant="secondary"
        onPress={() => setCabrits((prev) => [...prev, nouveauCabrit()])}
      />

      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Facultatif"
        multiline
        style={styles.textarea}
      />

      <View style={styles.row}>
        <Button style={styles.flex1} variant="secondary" label="Annuler" onPress={() => router.back()} />
        <Button
          style={styles.flex1}
          label="Enregistrer la naissance"
          onPress={enregistrer}
          loading={enregistrement}
        />
      </View>
    </Screen>
    </AccentColorProvider>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  cabritCard: { gap: 10 },
  cabritHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cabritTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  checkboxes: { gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
