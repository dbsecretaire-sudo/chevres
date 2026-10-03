import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { creerClient } from '@/features/clients/repository';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

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
    if (!nom.trim()) return setErreur(TEXTES.commun.general.nomRequis);

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
        <FormField
          label={TEXTES.commun.general.nom}
          required
          value={nom}
          onChangeText={setNom}
          placeholder={TEXTES.clients.nouveauClient.nomDuClient}
        />
        <FormField
          label={TEXTES.commun.general.prenom}
          value={prenom}
          onChangeText={setPrenom}
          placeholder={TEXTES.commun.general.facultatif}
        />
        <FormField
          label={TEXTES.commun.general.telephone}
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
          placeholder={TEXTES.commun.general.facultatif}
        />
        <FormField
          label={TEXTES.commun.general.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder={TEXTES.commun.general.facultatif}
        />
        <FormField
          label={TEXTES.commun.general.adressePostale}
          value={adressePostale}
          onChangeText={setAdressePostale}
          multiline
          style={commonStyles.textarea}
          placeholder={TEXTES.commun.general.facultatif}
        />

        <View style={commonStyles.row}>
          <Button
            style={commonStyles.flex1}
            variant="secondary"
            label={TEXTES.commun.general.annuler}
            onPress={() => router.back()}
          />
          <Button
            style={commonStyles.flex1}
            label={TEXTES.commun.general.enregistrer}
            onPress={enregistrer}
            loading={enregistrement}
          />
        </View>
      </Screen>

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </AccentColorProvider>
  );
}
