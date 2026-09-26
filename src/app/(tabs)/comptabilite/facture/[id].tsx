import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { DateField } from '@/components/DateField';
import { SelectField } from '@/components/SelectField';
import { OptionsModal } from '@/components/OptionsModal';
import { ConfirmModal } from '@/components/ConfirmModal';

import { colors } from '@/theme/colors';

import {
  getFacture,
  enregistrerFacture,
  supprimerFacture,
} from '@/storage/repositories';

import type { Facture, TypeFacture } from '@/types/models';

import { formatDateFR } from '@/utils/dates';

export default function FicheFacture() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [facture, setFacture] = useState<Facture | null>(null);
  const [form, setForm] = useState<Facture | null>(null);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  // ---------------------------------------------------------------------------
  // CHARGEMENT
  // ---------------------------------------------------------------------------

  const charger = useCallback(async () => {
    if (!id) return;

    const f = await getFacture(id);

    setFacture(f ?? null);
    setForm(f ?? null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  // ---------------------------------------------------------------------------
  // ENREGISTREMENT
  // ---------------------------------------------------------------------------

  const enregistrerModifications = async () => {
    if (!form) return;

    try {
      await enregistrerFacture(form);

      setFacture(form);
      setEditing(false);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer les modifications.",
      );
    }
  };

  // ---------------------------------------------------------------------------
  // SUPPRESSION
  // ---------------------------------------------------------------------------

  const supprimerDefinitivement = async () => {
    if (!facture) return;

    try {
      await supprimerFacture(facture.id);

      router.back();
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Erreur',
        'Impossible de supprimer la facture.',
      );
    }
  };

  // ---------------------------------------------------------------------------
  // FACTURE INTROUVABLE
  // ---------------------------------------------------------------------------

  if (!facture || !form) {
    return (
      <Screen>
        <Text style={styles.notFound}>
          Facture introuvable.
        </Text>
      </Screen>
    );
  }

  // ---------------------------------------------------------------------------
  // AFFICHAGE
  // ---------------------------------------------------------------------------

  return (
    <Screen scroll={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ---------------------------------------------------------------- */}
        {/* EN-TÊTE                                                         */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.title}>
              {facture.tiers}
            </Text>

            <Text style={styles.subtitle}>
              {formatDateFR(facture.date)} ·{' '}
              {facture.montant.toFixed(2)} €
            </Text>
          </View>

          <View style={styles.headerDroite}>
            <Badge
              label={
                facture.type === 'emise'
                  ? 'Émise'
                  : 'Reçue'
              }
              color={
                facture.type === 'emise'
                  ? colors.primary
                  : colors.danger
              }
            />

            <Pressable
              style={styles.boutonMenu}
              onPress={() => setMenuOuvert(true)}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={22}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* MENU                                                             */}
        {/* ---------------------------------------------------------------- */}

        <OptionsModal
          visible={menuOuvert}
          onClose={() => setMenuOuvert(false)}
          title={facture.tiers}
          options={[
            {
              label: 'Modifier la facture',
              icon: 'create',
              onPress: () => {
                setMenuOuvert(false);
                setEditing(true);
              },
            },
            {
              label: 'Supprimer définitivement',
              icon: 'trash',
              onPress: () => {
                setMenuOuvert(false);
                setSuppressionOuverte(true);
              },
            },
          ]}
        />

        {/* ---------------------------------------------------------------- */}
        {/* MODE LECTURE                                                     */}
        {/* ---------------------------------------------------------------- */}

        {!editing ? (
          <Card>
            <Text style={styles.line}>
              Type :{' '}
              {facture.type === 'emise'
                ? 'Facture émise'
                : 'Facture reçue'}
            </Text>

            <Text style={styles.line}>
              Date : {formatDateFR(facture.date)}
            </Text>

            <Text style={styles.line}>
              Tiers : {facture.tiers}
            </Text>

            <Text style={styles.line}>
              Montant : {facture.montant.toFixed(2)} €
            </Text>

            {facture.description ? (
              <Text style={styles.line}>
                Description : {facture.description}
              </Text>
            ) : null}

            {facture.categorieDepense ? (
              <Text style={styles.line}>
                Catégorie de dépense :{' '}
                {facture.categorieDepense}
              </Text>
            ) : null}

            {facture.categorieRecette ? (
              <Text style={styles.line}>
                Catégorie de recette :{' '}
                {facture.categorieRecette}
              </Text>
            ) : null}

            {facture.typeAide ? (
              <Text style={styles.line}>
                Type d'aide : {facture.typeAide}
              </Text>
            ) : null}

            {facture.typeAideLibre ? (
              <Text style={styles.line}>
                Précision : {facture.typeAideLibre}
              </Text>
            ) : null}

            <Button
              label="Modifier la facture"
              variant="secondary"
              onPress={() => setEditing(true)}
            />
          </Card>
        ) : (
          /* ---------------------------------------------------------------- */
          /* MODE ÉDITION                                                     */
          /* ---------------------------------------------------------------- */

          <Card>
            <Text style={styles.cardTitle}>
              Modifier la facture
            </Text>

            <SelectField
              label="Type"
              value={form.type}
              onChange={(value) =>
                setForm({
                  ...form,
                  type: value as TypeFacture,
                })
              }
              options={[
                {
                  value: 'emise',
                  label: 'Facture émise',
                },
                {
                  value: 'recue',
                  label: 'Facture reçue',
                },
              ]}
            />

            <DateField
              label="Date"
              value={form.date}
              onChange={(date) =>
                setForm({
                  ...form,
                  date,
                })
              }
            />

            <FormField
              label="Tiers"
              value={form.tiers}
              onChangeText={(tiers) =>
                setForm({
                  ...form,
                  tiers,
                })
              }
              placeholder="Nom du tiers"
            />

            <FormField
              label="Montant"
              value={String(form.montant)}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  montant:
                    Number(
                      value.replace(',', '.'),
                    ) || 0,
                })
              }
              keyboardType="decimal-pad"
              placeholder="0,00"
            />

            <FormField
              label="Description"
              value={form.description ?? ''}
              onChangeText={(description) =>
                setForm({
                  ...form,
                  description,
                })
              }
              multiline
              style={styles.textarea}
              placeholder="Description"
            />

            <View style={styles.row}>
              <Button
                style={styles.flex1}
                variant="secondary"
                label="Annuler"
                onPress={() => {
                  setForm(facture);
                  setEditing(false);
                }}
              />

              <Button
                style={styles.flex1}
                label="Enregistrer"
                onPress={enregistrerModifications}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* CONFIRMATION DE SUPPRESSION                                        */}
      {/* ------------------------------------------------------------------ */}

      <ConfirmModal
        visible={suppressionOuverte}
        title="Supprimer définitivement ?"
        message={`Cette action supprimera définitivement la facture de ${facture.tiers}.`}
        confirmLabel="Supprimer définitivement"
        onCancel={() => setSuppressionOuverte(false)}
        onConfirm={supprimerDefinitivement}
      />
    </Screen>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  notFound: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 100,
    gap: 12,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerMain: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },

  headerDroite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  boutonMenu: {
    padding: 4,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  line: {
    fontSize: 14,
    color: colors.text,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  flex1: {
    flex: 1,
  },

  textarea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
