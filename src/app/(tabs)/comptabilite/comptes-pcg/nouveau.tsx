import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/Button';
import { InfoModal } from '@/components/InfoModal';
import { colors } from '@/theme/colors';
import { AccentColorProvider } from '@/theme/AccentColorContext';
import { creerComptePcg } from '@/storage/comptesPcg';

export default function NouveauComptePcg() {
  const router = useRouter();
  const [numero, setNumero] = useState('');
  const [libelle, setLibelle] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async () => {
    if (!numero.trim()) return setErreur('N° requis');
    if (!libelle.trim()) return setErreur('Description requise');

    setEnregistrement(true);
    try {
      await creerComptePcg({ numero: numero.trim(), libelle: libelle.trim() });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <FormField label="N°" required value={numero} onChangeText={setNumero} keyboardType="number-pad" placeholder="ex: 623000" />
        <FormField label="Description" required value={libelle} onChangeText={setLibelle} placeholder="ex: Publicité, publications" />

        <View style={styles.row}>
          <Button style={styles.flex1} variant="secondary" label="Annuler" onPress={() => router.back()} />
          <Button style={styles.flex1} label="Enregistrer" onPress={enregistrer} loading={enregistrement} />
        </View>
      </Screen>

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </AccentColorProvider>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
