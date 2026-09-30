import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/Button';
import { InfoModal } from '@/components/InfoModal';
import { colors } from '@/theme/colors';
import { AccentColorProvider } from '@/theme/AccentColorContext';
import { creerClient } from '@/storage/clients';

export default function NouveauClient() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adressePostale, setAdressePostale] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur('Nom requis');

    setEnregistrement(true);
    try {
      await creerClient({
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        adressePostale: adressePostale.trim() || undefined,
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <FormField label="Nom" required value={nom} onChangeText={setNom} placeholder="Nom du client" />
        <FormField label="Prénom" value={prenom} onChangeText={setPrenom} placeholder="Facultatif" />
        <FormField label="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholder="Facultatif" />
        <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="Facultatif" />
        <FormField
          label="Adresse postale"
          value={adressePostale}
          onChangeText={setAdressePostale}
          multiline
          style={styles.textarea}
          placeholder="Facultatif"
        />

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
  textarea: { minHeight: 70, textAlignVertical: 'top' },
});
