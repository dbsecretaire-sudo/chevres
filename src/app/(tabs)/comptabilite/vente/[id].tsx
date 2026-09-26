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

import {
  getVente,
  saveVente,
  supprimerVente,
} from '@/storage/repositories';

import type { Vente } from '@/types/models';

import { formatDateFR } from '@/utils/dates';

export default function FicheVente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [vente, setVente] = useState<Vente | null>(null);
  const [form, setForm] = useState<Vente | null>(null);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] =
    useState(false);
  const [montantTexte, setMontantTexte] = useState('');
  const [erreur, setErreur] = useState<{ titre: string; message?: string } | null>(null);

  // ---------------------------------------------------------------------------
  // CHARGEMENT
  // ---------------------------------------------------------------------------

  const charger = useCallback(async () => {
    if (!id) return;

    const v = await getVente(id);

    setVente(v ?? null);
    setForm(v ?? null);
    setMontantTexte(
        v?.prix != null ? String(v.prix).replace('.', ',') : '',
    );
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  // ---------------------------------------------------------------------------
  // LIBELLÉ
  // ---------------------------------------------------------------------------

  const libelleCategorie = (categorie: Vente['categorie']) => {
    switch (categorie) {
      case 'lait':
        return 'Lait';

      case 'fromage':
        return 'Fromage';

      case 'cabris':
        return 'Cabris';

      default:
        return categorie;
    }
  };

  // ---------------------------------------------------------------------------
  // UNITÉ
  // ---------------------------------------------------------------------------

  const libelleQuantite = (v: Vente) => {
    if (v.categorie === 'lait') {
      return `${v.quantite} L`;
    }

    if (v.categorie === 'cabris') {
      return `${v.quantite} ${
        v.quantite > 1 ? 'têtes' : 'tête'
      }`;
    }

    return `${v.quantite} ${v.unite}`;
  };

  // ---------------------------------------------------------------------------
  // CHANGEMENT DE PRODUIT (l'unité est fixe pour lait/cabris, comme à la création)
  // ---------------------------------------------------------------------------

  const changerCategorie = (categorie: Vente['categorie']) => {
    if (!form) return;
    const unite: Vente['unite'] =
      categorie === 'lait' ? 'litres' : categorie === 'cabris' ? 'piece' : form.unite === 'kg' ? 'kg' : 'piece';
    setForm({ ...form, categorie, unite });
  };

  // ---------------------------------------------------------------------------
  // ENREGISTREMENT
  // ---------------------------------------------------------------------------

  const enregistrerModifications = async () => {
    if (!form) return;

    if (!form.quantite || form.quantite <= 0) {
      setErreur({ titre: 'Quantité invalide' });
      return;
    }
    if (form.categorie !== 'lait' && (!form.prix || form.prix < 0)) {
      setErreur({ titre: 'Prix invalide' });
      return;
    }

    try {
      await saveVente(form);

      setVente(form);
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
    if (!vente) return;

    try {
      await supprimerVente(vente.id);

      router.back();
    } catch (error) {
      console.error(error);

      setErreur({ titre: 'Erreur', message: 'Impossible de supprimer la vente.' });
    }
  };

  // ---------------------------------------------------------------------------
  // VENTE INTROUVABLE
  // ---------------------------------------------------------------------------

  if (!vente || !form) {
    return (
      <Screen>
        <Text style={styles.notFound}>
          Vente introuvable.
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
              {libelleCategorie(vente.categorie)}
            </Text>

            <Text style={styles.subtitle}>
              {formatDateFR(vente.date)} ·{' '}
              {vente.prix?.toFixed(2)} €
            </Text>
          </View>

          <View style={styles.headerDroite}>
            <Badge
              label="Vente"
              color={colors.primary}
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
          title={libelleCategorie(vente.categorie)}
          options={[
            {
              label: 'Modifier la vente',
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
              Type : Vente de production
            </Text>

            <Text style={styles.line}>
              Produit :{' '}
              {libelleCategorie(vente.categorie)}
            </Text>

            <Text style={styles.line}>
              Date : {formatDateFR(vente.date)}
            </Text>

            <Text style={styles.line}>
              Quantité : {libelleQuantite(vente)}
            </Text>

            <Text style={styles.line}>
              Montant : {vente.prix?.toFixed(2)} €
            </Text>

            <Button
              label="Modifier la vente"
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
              Modifier la vente
            </Text>

            <SelectField
              label="Produit"
              value={form.categorie}
              onChange={(value) => changerCategorie(value as Vente['categorie'])}
              options={[
                {
                  value: 'lait',
                  label: 'Lait',
                },
                {
                  value: 'fromage',
                  label: 'Fromage',
                },
                {
                  value: 'cabris',
                  label: 'Cabris',
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
              label="Quantité"
              value={String(form.quantite)}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  quantite:
                    Number(
                      value.replace(',', '.'),
                    ) || 0,
                })
              }
              keyboardType="decimal-pad"
              placeholder="0"
            />

            {form.categorie === 'fromage' ? (
            <SelectField
                label="Unité"
                value={form.unite ?? ''}
                onChange={(value) =>
                setForm({
                    ...form,
                    unite: value as Vente['unite'],
                })
                }
                options={[
                {
                    value: 'kg',
                    label: 'kg',
                },
                {
                    value: 'piece',
                    label: 'Pièce',
                },
                ]}
            />
            ) : null}

            <FormField
                label="Prix total (€)"
                required={form.categorie !== 'lait'}
                value={montantTexte}
                onChangeText={(value) => {
                    // Autorise uniquement chiffres + une virgule ou un point
                    if (!/^\d*[,.]?\d*$/.test(value)) {
                    return;
                    }

                    setMontantTexte(value);

                    const texte = value.replace(',', '.');

                    setForm({
                    ...form,
                    prix:
                        texte === '' || texte === '.'
                        ? undefined
                        : Number(texte),
                    });
                }}
                keyboardType="decimal-pad"
                placeholder={form.categorie === 'lait' ? 'Facultatif' : '0,00'}
                />

            <View style={styles.row}>
              <Button
                style={styles.flex1}
                variant="secondary"
                label="Annuler"
                onPress={() => {
                    setForm(vente);

                    setMontantTexte(
                    vente.prix != null
                        ? String(vente.prix).replace('.', ',')
                        : '',
                    );

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
        message={`Cette action supprimera définitivement cette vente de ${formatDateFR(vente.date)}.`}
        confirmLabel="Supprimer définitivement"
        onCancel={() =>
          setSuppressionOuverte(false)
        }
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

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  flex1: {
    flex: 1,
  },
});