import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { InfoModal } from '@/shared/components/InfoModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { structureTypeDe } from '@/features/dossiers/services/structure';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** La structure type : les sous-dossiers créés dans le dossier de chaque nouveau client (modifiable à tout moment). */
export default function StructureDossiers() {
  const router = useRouter();
  const { settings, patchSettings, loaded } = useAppSettings();
  const infos = settings.exploitation?.entreprise;
  const [noms, setNoms] = useState<string[]>(() => structureTypeDe(infos));
  const [erreur, setErreur] = useState<string | null>(null);
  const T = TEXTES.dossiers.structure;

  useEffect(() => {
    // Chargement initial unique depuis les réglages — pas de re-render en cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setNoms(structureTypeDe(infos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const enregistrer = async () => {
    if (noms.some((n) => !n.trim())) return setErreur(T.nomVide);
    await patchSettings({
      exploitation: {
        ...settings.exploitation,
        entreprise: { ...infos, structureDossiers: noms.map((n) => n.trim()) },
      },
    });
    router.back();
  };

  return (
    <Screen>
      <Text style={commonStyles.muted}>{T.aide}</Text>
      <Card>
        {noms.map((nom, index) => (
          <View key={index} style={styles.ligneStructure}>
            <View style={commonStyles.flex1}>
              <FormField
                label={index === 0 ? T.nomDuDossier : undefined}
                value={nom}
                onChangeText={(v) => setNoms((prev) => prev.map((n, i) => (i === index ? v : n)))}
              />
            </View>
            <Pressable
              style={commonStyles.boutonPastille}
              accessibilityLabel={T.retirer}
              onPress={() => setNoms((prev) => prev.filter((_, i) => i !== index))}
            >
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </Pressable>
          </View>
        ))}
        <Button variant="secondary" label={T.ajouter} onPress={() => setNoms((prev) => [...prev, ''])} />
      </Card>

      <View style={commonStyles.row}>
        <Button
          style={commonStyles.flex1}
          variant="secondary"
          label={TEXTES.commun.general.annuler}
          onPress={() => router.back()}
        />
        <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={enregistrer} />
      </View>

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </Screen>
  );
}
