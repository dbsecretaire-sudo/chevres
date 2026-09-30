import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ListRow } from '@/components/ListRow';
import { OptionsModal } from '@/components/OptionsModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { InfoModal } from '@/components/InfoModal';

import { colors } from '@/theme/colors';
import { getFournisseur, enregistrerFournisseur, supprimerFournisseur } from '@/storage/fournisseurs';
import { listToutesFactures } from '@/storage/repositories';
import { formatDateFR, formatMontant } from '@/utils/dates';
import type { Facture, Fournisseur } from '@/types/models';

export default function FicheFournisseur() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null);
  const [form, setForm] = useState<Fournisseur | null>(null);
  const [ecritures, setEcritures] = useState<Facture[]>([]);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const f = await getFournisseur(id);
    setFournisseur(f ?? null);
    setForm(f ?? null);
    if (f) {
      const toutes = await listToutesFactures();
      setEcritures(toutes.filter((fac) => fac.type === 'recue' && fac.tiers === f.nomEntreprise));
    } else {
      setEcritures([]);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const enregistrerModifications = async () => {
    if (!form) return;
    if (!form.nom.trim()) return setErreur('Nom requis');
    if (!form.nomEntreprise.trim()) return setErreur('Nom d’entreprise requis');
    if (!form.siret.trim()) return setErreur('SIRET requis');
    if (!form.adressePostale.trim()) return setErreur('Adresse postale requise');

    const nettoye: Fournisseur = {
      ...form,
      nom: form.nom.trim(),
      prenom: form.prenom?.trim() || undefined,
      nomEntreprise: form.nomEntreprise.trim(),
      siret: form.siret.trim(),
      tva: form.tva?.trim() || undefined,
      rib: form.rib?.trim() || undefined,
      adressePostale: form.adressePostale.trim(),
    };
    await enregistrerFournisseur(nettoye);
    setFournisseur(nettoye);
    setForm(nettoye);
    setEditing(false);
  };

  const supprimerDefinitivement = async () => {
    if (!fournisseur) return;
    await supprimerFournisseur(fournisseur.id);
    router.back();
  };

  if (!fournisseur || !form) {
    return (
      <Screen>
        <Text style={styles.notFound}>Fournisseur introuvable.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>{fournisseur.nomEntreprise}</Text>
            <Text style={styles.subtitle}>
              {fournisseur.nom}
              {fournisseur.prenom ? ` ${fournisseur.prenom}` : ''}
            </Text>
          </View>
          <Pressable style={styles.boutonMenu} onPress={() => setMenuOuvert(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>

        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={fournisseur.nomEntreprise}
          options={[
            { label: 'Modifier la fiche', icon: 'create', onPress: () => { setMenuOuvert(false); setEditing(true); } },
            { label: 'Supprimer définitivement', icon: 'trash', color: colors.danger, onPress: () => { setMenuOuvert(false); setSuppressionOuverte(true); } },
          ]}
        />

        {!editing ? (
          <Card>
            <Text style={styles.line}>Nom d’entreprise : {fournisseur.nomEntreprise}</Text>
            <Text style={styles.line}>
              Contact : {fournisseur.nom}
              {fournisseur.prenom ? ` ${fournisseur.prenom}` : ''}
            </Text>
            <Text style={styles.line}>SIRET : {fournisseur.siret}</Text>
            {fournisseur.tva ? <Text style={styles.line}>TVA intracommunautaire : {fournisseur.tva}</Text> : null}
            {fournisseur.rib ? <Text style={styles.line}>RIB : {fournisseur.rib}</Text> : null}
            <Text style={styles.line}>Adresse : {fournisseur.adressePostale}</Text>

            <Button label="Modifier la fiche" variant="secondary" onPress={() => setEditing(true)} />
          </Card>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>Modifier la fiche</Text>

            <FormField label="Nom d’entreprise" required value={form.nomEntreprise} onChangeText={(v) => setForm({ ...form, nomEntreprise: v })} />
            <FormField label="Nom" required value={form.nom} onChangeText={(v) => setForm({ ...form, nom: v })} />
            <FormField label="Prénom" value={form.prenom ?? ''} onChangeText={(v) => setForm({ ...form, prenom: v })} placeholder="Facultatif" />
            <FormField label="SIRET" required value={form.siret} onChangeText={(v) => setForm({ ...form, siret: v })} keyboardType="number-pad" />
            <FormField label="TVA intracommunautaire" value={form.tva ?? ''} onChangeText={(v) => setForm({ ...form, tva: v })} placeholder="Facultatif" />
            <FormField label="RIB" value={form.rib ?? ''} onChangeText={(v) => setForm({ ...form, rib: v })} placeholder="Facultatif" />
            <FormField
              label="Adresse postale"
              required
              value={form.adressePostale}
              onChangeText={(v) => setForm({ ...form, adressePostale: v })}
              multiline
              style={styles.textarea}
            />

            <View style={styles.row}>
              <Button
                style={styles.flex1}
                variant="secondary"
                label="Annuler"
                onPress={() => { setForm(fournisseur); setEditing(false); }}
              />
              <Button style={styles.flex1} label="Enregistrer" onPress={enregistrerModifications} />
            </View>
          </Card>
        )}

        {!editing && ecritures.length > 0 && (
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total payé à ce fournisseur</Text>
            <Text style={styles.totalValeur}>
              {formatMontant(ecritures.reduce((s, f) => s + f.montant, 0))}
            </Text>
          </Card>
        )}

        {!editing && (
          <View style={styles.ecrituresBloc}>
            <Text style={styles.ecrituresTitre}>
              Écritures liées{ecritures.length > 0 ? ` (${ecritures.length})` : ''}
            </Text>
            {ecritures.length === 0 ? (
              <Text style={styles.ecrituresVide}>Aucune écriture liée à ce fournisseur pour l’instant.</Text>
            ) : (
              ecritures.map((f) => (
                <ListRow
                  key={f.id}
                  title={f.description || 'Facture'}
                  subtitle={formatDateFR(f.date)}
                  trailing={<Text style={styles.montantEcriture}>-{formatMontant(f.montant)}</Text>}
                  onPress={() => router.push(`/comptabilite/facture/${f.id}`)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={suppressionOuverte}
        title="Supprimer définitivement ?"
        message={`Cette action supprimera définitivement la fiche de ${fournisseur.nomEntreprise}. Les factures déjà enregistrées ne sont pas modifiées.`}
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
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  totalCard: { alignItems: 'center', gap: 2 },
  totalLabel: { fontSize: 12, color: colors.textMuted },
  totalValeur: { fontSize: 20, fontWeight: '800', color: colors.danger },
  ecrituresBloc: { gap: 10 },
  ecrituresTitre: { fontSize: 15, fontWeight: '700', color: colors.text },
  ecrituresVide: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  montantEcriture: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
