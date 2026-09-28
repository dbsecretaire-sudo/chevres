import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { OptionsModal } from '@/components/OptionsModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { InfoModal } from '@/components/InfoModal';

import { colors } from '@/theme/colors';
import { getComptePcg, enregistrerComptePcg, supprimerComptePcg, type CompteComptableEnregistre } from '@/storage/comptesPcg';

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

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const enregistrerModifications = async () => {
    if (!form) return;
    if (!form.numero.trim()) return setErreur('N° requis');
    if (!form.libelle.trim()) return setErreur('Description requise');

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
        <Text style={styles.notFound}>Compte introuvable.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>{compte.numero}</Text>
            <Text style={styles.subtitle}>{compte.libelle}</Text>
          </View>
          <Pressable style={styles.boutonMenu} onPress={() => setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={compte.numero}
          options={[
            { label: 'Modifier la fiche', icon: 'create', onPress: () => { setMenuOuvert(false); setEditing(true); } },
            { label: 'Supprimer définitivement', icon: 'trash', color: colors.danger, onPress: () => { setMenuOuvert(false); setSuppressionOuverte(true); } },
          ]}
        />

        {!editing ? (
          <Card>
            <Text style={styles.line}>N° : {compte.numero}</Text>
            <Text style={styles.line}>Description : {compte.libelle}</Text>

            <Button label="Modifier la fiche" variant="secondary" onPress={() => setEditing(true)} />
          </Card>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>Modifier la fiche</Text>

            <FormField label="N°" required value={form.numero} onChangeText={(v) => setForm({ ...form, numero: v })} keyboardType="number-pad" />
            <FormField label="Description" required value={form.libelle} onChangeText={(v) => setForm({ ...form, libelle: v })} />

            <View style={styles.row}>
              <Button
                style={styles.flex1}
                variant="secondary"
                label="Annuler"
                onPress={() => { setForm(compte); setEditing(false); }}
              />
              <Button style={styles.flex1} label="Enregistrer" onPress={enregistrerModifications} />
            </View>
          </Card>
        )}
      </ScrollView>

      <ConfirmModal
        visible={suppressionOuverte}
        title="Supprimer définitivement ?"
        message={`Cette action supprimera définitivement le compte ${compte.numero} — ${compte.libelle}.`}
        confirmLabel="Supprimer définitivement"
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimerDefinitivement}
      />

      <InfoModal visible={!!erreur} title={erreur ?? ''} onClose={() => setErreur(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerMain: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  boutonMenu: { padding: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  line: { fontSize: 14, color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
