import { useCallback, useState } from 'react';
import {
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
import { InfoModal } from '@/components/InfoModal';

import { colors } from '@/theme/colors';
import { LABEL_TYPE_ALIMENT, LABEL_TYPE_CARBURANT } from '@/utils/planComptable';

import {
  getFacture,
  enregistrerFacture,
  supprimerFacture,
} from '@/storage/repositories';

import type { Facture, TypeAliment, TypeCarburant } from '@/types/models';

import { formatDateFR } from '@/utils/dates';
import { generateId } from '@/utils/id';

interface LigneAlimentForm {
  key: string;
  type: TypeAliment;
  montant: string;
  quantiteKg: string;
  typeLibre: string;
}

function versLignesForm(facture: Facture): LigneAlimentForm[] {
  return (facture.lignesAlimentation ?? []).map((l) => ({
    key: generateId(),
    type: l.type,
    montant: String(l.montant),
    quantiteKg: l.quantiteKg !== undefined ? String(l.quantiteKg) : '',
    typeLibre: l.typeLibre ?? '',
  }));
}

export default function FicheFacture() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [facture, setFacture] = useState<Facture | null>(null);
  const [form, setForm] = useState<Facture | null>(null);
  const [lignes, setLignes] = useState<LigneAlimentForm[]>([]);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<{ titre: string; message?: string } | null>(null);

  const estAlimentation = facture?.categorieDepense === 'alimentation';
  const totalAlimentation = lignes.reduce((s, l) => s + (Number(l.montant.replace(',', '.')) || 0), 0);

  const majLigne = (key: string, patch: Partial<LigneAlimentForm>) => {
    setLignes((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const supprimerLigne = (key: string) => {
    setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  // ---------------------------------------------------------------------------
  // CHARGEMENT
  // ---------------------------------------------------------------------------

  const charger = useCallback(async () => {
    if (!id) return;

    const f = await getFacture(id);

    setFacture(f ?? null);
    setForm(f ?? null);
    setLignes(f ? versLignesForm(f) : []);
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

    if (!form.tiers.trim()) {
      setErreur({ titre: form.type === 'recue' ? 'Fournisseur requis' : 'Client requis' });
      return;
    }

    let aEnregistrer = form;

    if (estAlimentation) {
      const lignesFinales = lignes
        .map((l) => ({
          type: l.type,
          montant: Number(l.montant.replace(',', '.')),
          quantiteKg: Number(l.quantiteKg.replace(',', '.')) || undefined,
          typeLibre: l.type === 'autre' ? l.typeLibre.trim() || undefined : undefined,
        }))
        .filter((l) => l.montant > 0);
      if (lignesFinales.length === 0) {
        setErreur({ titre: 'Montant invalide', message: 'Ajoutez au moins un montant pour un aliment.' });
        return;
      }
      aEnregistrer = { ...form, montant: totalAlimentation, lignesAlimentation: lignesFinales };
    } else if (!form.montant || form.montant <= 0) {
      setErreur({ titre: 'Montant invalide' });
      return;
    }

    try {
      await enregistrerFacture(aEnregistrer);

      setFacture(aEnregistrer);
      setForm(aEnregistrer);
      setEditing(false);
    } catch (error) {
      console.error(error);

      setErreur({ titre: 'Erreur', message: "Impossible d'enregistrer les modifications." });
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

      setErreur({ titre: 'Erreur', message: 'Impossible de supprimer la facture.' });
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

            {facture.typeCarburant ? (
              <Text style={styles.line}>
                Type de carburant : {LABEL_TYPE_CARBURANT[facture.typeCarburant]}
              </Text>
            ) : null}

            {facture.litrage !== undefined ? (
              <Text style={styles.line}>
                Litrage : {facture.litrage} L
              </Text>
            ) : null}

            {facture.typeAide ? (
              <Text style={styles.line}>
                Type d&apos;aide : {facture.typeAide}
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

            <Text style={styles.lockedLabel}>Type</Text>
            <Text style={styles.lockedValue}>
              {form.type === 'emise' ? 'Facture émise' : 'Facture reçue'}
            </Text>
            <Text style={styles.lockedNote}>
              Non modifiable : la catégorie, le compte comptable et les rapports sont liés au type choisi à la
              création. Supprimez la facture et recréez-la si le type est erroné.
            </Text>

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

            {estAlimentation ? (
              <Card style={styles.lignesCard}>
                <Text style={styles.lignesTitre}>Détail par aliment</Text>
                {lignes.map((ligne, index) => (
                  <View key={ligne.key} style={styles.ligneBloc}>
                    <SelectField
                      label={`Aliment ${index + 1}`}
                      value={ligne.type}
                      onChange={(v) => majLigne(ligne.key, { type: v })}
                      options={Object.entries(LABEL_TYPE_ALIMENT).map(([value, label]) => ({ value: value as TypeAliment, label }))}
                    />
                    {ligne.type === 'autre' && (
                      <FormField
                        label="Préciser"
                        value={ligne.typeLibre}
                        onChangeText={(v) => majLigne(ligne.key, { typeLibre: v })}
                        placeholder="ex: Frais de livraison, compléments…"
                      />
                    )}
                    <View style={styles.ligneRow}>
                      <View style={styles.ligneMontant}>
                        <FormField
                          label="Montant (€)"
                          value={ligne.montant}
                          onChangeText={(v) => majLigne(ligne.key, { montant: v })}
                          keyboardType="decimal-pad"
                          placeholder="ex: 120"
                        />
                      </View>
                      <View style={styles.ligneMontant}>
                        <FormField
                          label="Quantité (kg)"
                          value={ligne.quantiteKg}
                          onChangeText={(v) => majLigne(ligne.key, { quantiteKg: v })}
                          keyboardType="decimal-pad"
                          placeholder="Facultatif"
                        />
                      </View>
                      {lignes.length > 1 && (
                        <Button label="✕" variant="danger" onPress={() => supprimerLigne(ligne.key)} />
                      )}
                    </View>
                  </View>
                ))}
                <Button
                  label="+ Ajouter un aliment"
                  variant="secondary"
                  onPress={() =>
                    setLignes((prev) => [
                      ...prev,
                      { key: generateId(), type: 'foin', montant: '', quantiteKg: '', typeLibre: '' },
                    ])
                  }
                />
                <Text style={styles.totalAlimentation}>Total facture : {totalAlimentation.toFixed(2).replace('.', ',')} €</Text>
              </Card>
            ) : (
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
            )}

            {facture.categorieDepense === 'carburant' && (
              <>
                <SelectField
                  label="Type de carburant"
                  required
                  value={form.typeCarburant ?? 'gazoil'}
                  onChange={(v) => setForm({ ...form, typeCarburant: v })}
                  options={Object.entries(LABEL_TYPE_CARBURANT).map(([value, label]) => ({ value: value as TypeCarburant, label }))}
                />
                <FormField
                  label="Litrage (L)"
                  value={form.litrage !== undefined ? String(form.litrage) : ''}
                  onChangeText={(v) =>
                    setForm({ ...form, litrage: Number(v.replace(',', '.')) || undefined })
                  }
                  keyboardType="decimal-pad"
                  placeholder="Facultatif — utile pour les aides calculées au litre (GNR…)"
                />
              </>
            )}

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
                  setLignes(versLignesForm(facture));
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

      <InfoModal
        visible={!!erreur}
        title={erreur?.titre ?? ''}
        message={erreur?.message}
        onClose={() => setErreur(null)}
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

  lockedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },

  lockedValue: {
    fontSize: 15,
    color: colors.text,
  },

  lockedNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
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

  lignesCard: { gap: 10 },
  lignesTitre: { fontSize: 14, fontWeight: '700', color: colors.text },
  ligneBloc: { gap: 8 },
  ligneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  ligneMontant: { flex: 1 },
  totalAlimentation: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
});
