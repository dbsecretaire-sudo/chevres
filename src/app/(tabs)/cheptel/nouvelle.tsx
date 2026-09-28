import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { BoucleField } from '@/components/BoucleField';
import { DateField } from '@/components/DateField';
import { SelectField } from '@/components/SelectField';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Card } from '@/components/Card';
import { colors } from '@/theme/colors';
import { creerChevre, enregistrerNaissance, numeroBoucleExiste } from '@/storage/repositories';
import { currentYear, todayISO } from '@/utils/dates';
import { generateId } from '@/utils/id';
import { useAjoutTabBarBleu } from '@/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/theme/AccentColorContext';
import type { Sexe } from '@/types/models';

interface CabritForm {
  key: string;
  numeroBoucle: string;
  sexe: Sexe;
  mortNe: boolean;
}

function nouveauCabrit(): CabritForm {
  return { key: generateId(), numeroBoucle: '', sexe: 'F', mortNe: false };
}

export default function NouvelleChevre() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const params = useLocalSearchParams<{ numeroBoucle?: string; sexe?: Sexe }>();
  const [numeroBoucle, setNumeroBoucle] = useState(params.numeroBoucle ?? '');
  const [dateBouclage, setDateBouclage] = useState('');
  const [nom, setNom] = useState('');
  const [sexe, setSexe] = useState<Sexe>(params.sexe === 'M' ? 'M' : 'F');
  const [dateNaissance, setDateNaissance] = useState(todayISO());
  const [mereNumeroBoucle, setMereNumeroBoucle] = useState('');
  const [notes, setNotes] = useState('');
  const [renouvellement, setRenouvellement] = useState(false);
  const [renouvellementAnnee, setRenouvellementAnnee] = useState(String(currentYear()));
  const [enregistrement, setEnregistrement] = useState(false);

  const [avecCabrits, setAvecCabrits] = useState(false);
  const [dateMiseBas, setDateMiseBas] = useState(todayISO());
  const [cabrits, setCabrits] = useState<CabritForm[]>([nouveauCabrit()]);

  const majCabrit = (key: string, patch: Partial<CabritForm>) => {
    setCabrits((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const supprimerCabrit = (key: string) => {
    setCabrits((prev) => (prev.length > 1 ? prev.filter((c) => c.key !== key) : prev));
  };

  const enregistrer = async () => {
    if (avecCabrits && !numeroBoucle.trim()) {
      Alert.alert('N° de boucle requis', 'Pour enregistrer ses cabris, il faut le n° de boucle de la mère.');
      return;
    }

    const boucleMere = numeroBoucle.trim();
    const bouclesCabrits = avecCabrits
      ? cabrits.map((c) => c.numeroBoucle.trim()).filter((b) => b.length > 0)
      : [];
    const doublonsLocaux = bouclesCabrits.filter((b, i) => bouclesCabrits.indexOf(b) !== i || b === boucleMere);
    if (doublonsLocaux.length > 0) {
      Alert.alert('N° de boucle en double', `Le n° ${doublonsLocaux[0]} est utilisé plusieurs fois dans ce formulaire.`);
      return;
    }

    setEnregistrement(true);
    try {
      const bouclesAVerifier = boucleMere ? [boucleMere, ...bouclesCabrits] : bouclesCabrits;
      for (const boucle of bouclesAVerifier) {
        if (await numeroBoucleExiste(boucle)) {
          Alert.alert('N° de boucle déjà utilisé', `Le n° ${boucle} est déjà attribué à une autre chèvre.`);
          return;
        }
      }

      const chevre = await creerChevre({
        numeroBoucle: boucleMere || undefined,
        dateBouclage: boucleMere ? dateBouclage || undefined : undefined,
        nom: nom.trim() || undefined,
        sexe,
        dateNaissance,
        mereNumeroBoucle: mereNumeroBoucle.trim() || undefined,
        notes: notes.trim() || undefined,
        renouvellement,
        renouvellementAnnee: renouvellement ? Number(renouvellementAnnee) || currentYear() : undefined,
      });

      if (avecCabrits && chevre.numeroBoucle) {
        await enregistrerNaissance({
          date: dateMiseBas,
          mereId: chevre.id,
          mereNumeroBoucle: chevre.numeroBoucle,
          cabrits: cabrits.map((c) => ({
            numeroBoucle: c.numeroBoucle.trim() || undefined,
            sexe: c.sexe,
            mortNe: c.mortNe,
          })),
        });
      }
      router.replace('/cheptel');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
    <Screen>
      <BoucleField
        label="N° de boucle"
        value={numeroBoucle}
        onChangeText={setNumeroBoucle}
        placeholder="Facultatif avant 6 mois"
      />
      {!!numeroBoucle.trim() && (
        <DateField label="Date de bouclage" value={dateBouclage} onChange={setDateBouclage} />
      )}
      <FormField label="Nom" value={nom} onChangeText={setNom} placeholder="Facultatif" />
      <SelectField
        label="Sexe"
        required
        value={sexe}
        onChange={setSexe}
        options={[
          { value: 'F', label: 'Femelle' },
          { value: 'M', label: 'Mâle' },
        ]}
      />
      <DateField label="Date de naissance" required value={dateNaissance} onChange={setDateNaissance} />
      <BoucleField
        label="N° de boucle de la mère"
        value={mereNumeroBoucle}
        onChangeText={setMereNumeroBoucle}
        placeholder="Facultatif"
      />
      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Facultatif"
        multiline
        style={styles.textarea}
      />
      <Checkbox label="Désigné(e) pour le renouvellement" value={renouvellement} onChange={setRenouvellement} />
      {renouvellement && (
        <FormField
          label="Année de désignation"
          value={renouvellementAnnee}
          onChangeText={setRenouvellementAnnee}
          keyboardType="number-pad"
          placeholder={String(currentYear())}
        />
      )}

      {sexe === 'F' && (
        <Checkbox
          label="Cette chèvre a des cabris à enregistrer"
          value={avecCabrits}
          onChange={setAvecCabrits}
        />
      )}

      {sexe === 'F' && avecCabrits && (
        <Card style={styles.cabritsCard}>
          <Text style={styles.sectionTitle}>Cabris</Text>
          <DateField label="Date de la mise bas" required value={dateMiseBas} onChange={setDateMiseBas} />
          {cabrits.map((cabrit, index) => (
            <Card key={cabrit.key} style={styles.cabritCard}>
              <View style={styles.cabritHeader}>
                <Text style={styles.cabritTitle}>Cabri {index + 1}</Text>
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
              <Checkbox
                label="Mort-né"
                value={cabrit.mortNe}
                onChange={(v) => majCabrit(cabrit.key, { mortNe: v })}
                activeColor={colors.danger}
              />
            </Card>
          ))}
          <Button
            label="+ Ajouter un cabri"
            variant="secondary"
            onPress={() => setCabrits((prev) => [...prev, nouveauCabrit()])}
          />
        </Card>
      )}

      <View style={styles.row}>
        <Button style={styles.flex1} variant="secondary" label="Annuler" onPress={() => router.replace('/cheptel')} />
        <Button style={styles.flex1} label="Enregistrer" onPress={enregistrer} loading={enregistrement} />
      </View>
    </Screen>
    </AccentColorProvider>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  cabritsCard: { gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cabritCard: { gap: 10 },
  cabritHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cabritTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
});
