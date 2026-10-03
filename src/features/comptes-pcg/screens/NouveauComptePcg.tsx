import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { creerComptePcg } from '@/features/comptes-pcg/repository';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function NouveauComptePcg() {
  const router = useRouter();
  const [numero, setNumero] = useState('');
  const [libelle, setLibelle] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async () => {
    if (!numero.trim()) return setErreur(TEXTES.commun.general.nRequis);
    if (!libelle.trim()) return setErreur(TEXTES.commun.general.descriptionRequise);

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
        <FormField
          label="N°"
          required
          value={numero}
          onChangeText={setNumero}
          keyboardType="number-pad"
          placeholder={TEXTES.comptesPcg.nouveauComptePcg.ex623000}
        />
        <FormField
          label={TEXTES.commun.general.description}
          required
          value={libelle}
          onChangeText={setLibelle}
          placeholder={TEXTES.comptesPcg.nouveauComptePcg.exPublicitePublications}
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
