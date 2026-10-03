import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { InfoModal } from '@/shared/components/InfoModal';

import { colors } from '@/shared/theme/colors';
import {
  getComptePcg,
  enregistrerComptePcg,
  supprimerComptePcg,
  type CompteComptableEnregistre,
} from '@/features/comptes-pcg/repository';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export default function FicheComptePcg() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [compte, setCompte] = useState<CompteComptableEnregistre | null>(null);
  const [form, setForm] = useState<CompteComptableEnregistre | null>(null);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const c = await getComptePcg(id);
    setCompte(c ?? null);
    setForm(c ?? null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const enregistrerModifications = async () => {
    if (!form) return;
    if (!form.numero.trim()) return setErreur(TEXTES.commun.general.nRequis);
    if (!form.libelle.trim()) return setErreur(TEXTES.commun.general.descriptionRequise);

    const nettoye: CompteComptableEnregistre = {
      ...form,
      numero: form.numero.trim(),
      libelle: form.libelle.trim(),
    };
    await enregistrerComptePcg(nettoye);
    setCompte(nettoye);
    setForm(nettoye);
    setEditing(false);
  };

  const supprimerDefinitivement = async () => {
    if (!compte) return;
    await supprimerComptePcg(compte.id);
    router.back();
  };

  if (!compte || !form) {
    return (
      <Screen>
        <Text style={commonStyles.notFound}>{TEXTES.comptesPcg.ficheComptePcg.compteIntrouvable}</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.header}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.title}>{compte.numero}</Text>
            <Text style={commonStyles.subtitle}>{compte.libelle}</Text>
          </View>
          <Pressable style={commonStyles.boutonMenu} onPress={() => setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={compte.numero}
          options={[
            {
              label: TEXTES.commun.general.modifierLaFiche,
              icon: 'create',
              onPress: () => {
                setMenuOuvert(false);
                setEditing(true);
              },
            },
            {
              label: TEXTES.commun.general.supprimerDefinitivement,
              icon: 'trash',
              color: colors.danger,
              onPress: () => {
                setMenuOuvert(false);
                setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {!editing ? (
          <Card>
            <Text style={commonStyles.line}>N° : {compte.numero}</Text>
            <Text style={commonStyles.line}>
              {TEXTES.comptesPcg.ficheComptePcg.descriptionDeuxPoints}
              {compte.libelle}
            </Text>

            <Button
              label={TEXTES.commun.general.modifierLaFiche}
              variant="secondary"
              onPress={() => setEditing(true)}
            />
          </Card>
        ) : (
          <Card>
            <Text style={commonStyles.cardTitle}>{TEXTES.commun.general.modifierLaFiche}</Text>

            <FormField
              label="N°"
              required
              value={form.numero}
              onChangeText={(v) => setForm({ ...form, numero: v })}
              keyboardType="number-pad"
            />
            <FormField
              label={TEXTES.commun.general.description}
              required
              value={form.libelle}
              onChangeText={(v) => setForm({ ...form, libelle: v })}
            />

            <View style={commonStyles.row}>
              <Button
                style={commonStyles.flex1}
                variant="secondary"
                label={TEXTES.commun.general.annuler}
                onPress={() => {
                  setForm(compte);
                  setEditing(false);
                }}
              />
              <Button
                style={commonStyles.flex1}
                label={TEXTES.commun.general.enregistrer}
                onPress={enregistrerModifications}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      <ConfirmModal
        visible={suppressionOuverte}
        title={TEXTES.commun.general.supprimerDefinitivementQuestion}
        message={TEXTES.comptesPcg.ficheComptePcg.cetteActionSupprimeraDefinitivementLe(
          compte.numero,
          compte.libelle,
        )}
        confirmLabel={TEXTES.commun.general.supprimerDefinitivement}
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimerDefinitivement}
      />

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </Screen>
  );
}
