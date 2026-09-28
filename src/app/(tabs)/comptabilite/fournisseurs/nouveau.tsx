import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/Button';
import { InfoModal } from '@/components/InfoModal';
import { colors } from '@/theme/colors';
import { AccentColorProvider } from '@/theme/AccentColorContext';
import { creerFournisseur } from '@/storage/fournisseurs';

export default function NouveauFournisseur() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [siret, setSiret] = useState('');
  const [tva, setTva] = useState('');
  const [rib, setRib] = useState('');
  const [adressePostale, setAdressePostale] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur('Nom requis');
    if (!nomEntreprise.trim()) return setErreur('Nom d’entreprise requis');
    if (!siret.trim()) return setErreur('SIRET requis');
    if (!adressePostale.trim()) return setErreur('Adresse postale requise');

    setEnregistrement(true);
    try {
      await creerFournisseur({
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        nomEntreprise: nomEntreprise.trim(),
        siret: siret.trim(),
        tva: tva.trim() || undefined,
        rib: rib.trim() || undefined,
        adressePostale: adressePostale.trim(),
      });
      router.back();
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <FormField label="Nom d’entreprise" required value={nomEntreprise} onChangeText={setNomEntreprise} placeholder="ex: Coopérative agricole du Nord" />
        <FormField label="Nom" required value={nom} onChangeText={setNom} placeholder="Nom du contact" />
        <FormField label="Prénom" value={prenom} onChangeText={setPrenom} placeholder="Facultatif" />
        <FormField
          label="Adresse postale"
          required
          value={adressePostale}
          onChangeText={setAdressePostale}
          multiline
          style={styles.textarea}
          placeholder="Numéro, rue, code postal, ville"
        />
        <FormField label="SIRET" required value={siret} onChangeText={setSiret} keyboardType="number-pad" placeholder="14 chiffres" />
        <FormField label="TVA intracommunautaire" value={tva} onChangeText={setTva} placeholder="Facultatif" />
        <FormField label="RIB" value={rib} onChangeText={setRib} placeholder="Facultatif — IBAN / BIC" />
        
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
