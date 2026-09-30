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
  COMPTE_PAR_DEPENSE,
  COMPTE_PAR_RECETTE,
  LABEL_TYPE_ALIMENT,
  LABEL_TYPE_CARBURANT,
  LABEL_UNITE_CONDITIONNEMENT,
  POIDS_UNITE_CONDITIONNEMENT,
  TYPES_ALIMENT_CONDITIONNES,
} from '@/utils/planComptable';

import {
  getFacture,
  enregistrerFacture,
  supprimerFacture,
} from '@/storage/repositories';
import { listComptesPcg, type CompteComptableEnregistre } from '@/storage/comptesPcg';

import type { Client, Fournisseur, Facture, TypeAliment, TypeCarburant, UniteConditionnement } from '@/types/models';

import { formatDateFR, formatMontant } from '@/utils/dates';
import { generateId } from '@/utils/id';
import { listFournisseurs } from '@/storage/fournisseurs';
import { listClients } from '@/storage/clients';

interface LigneAlimentForm {
  key: string;
  type: TypeAliment;
  montant: string;
  quantiteKg: string;
  typeLibre: string;
  uniteConditionnement: UniteConditionnement;
  nombreUnitesConditionnement: string;
}

interface LigneCarburantForm {
  key: string;
  type: TypeCarburant;
  montant: string;
  litrage: string;
}

function versLignesForm(facture: Facture): LigneAlimentForm[] {
  return (facture.lignesAlimentation ?? []).map((l) => ({
    key: generateId(),
    type: l.type,
    montant: String(l.montant),
    quantiteKg: l.quantiteKg !== undefined ? String(l.quantiteKg) : '',
    typeLibre: l.typeLibre ?? '',
    uniteConditionnement: l.uniteConditionnement ?? 'matela',
    nombreUnitesConditionnement: l.nombreUnitesConditionnement !== undefined ? String(l.nombreUnitesConditionnement) : '',
  }));
}

function versLignesCarburantForm(facture: Facture): LigneCarburantForm[] {
  if (facture.lignesCarburant && facture.lignesCarburant.length > 0) {
    return facture.lignesCarburant.map((l) => ({
      key: generateId(),
      type: l.type,
      montant: String(l.montant),
      litrage: l.litrage !== undefined ? String(l.litrage) : '',
    }));
  }
  if (facture.typeCarburant) {
    return [
      {
        key: generateId(),
        type: facture.typeCarburant,
        montant: String(facture.montant),
        litrage: facture.litrage !== undefined ? String(facture.litrage) : '',
      },
    ];
  }
  return [{ key: generateId(), type: 'gazoil', montant: '', litrage: '' }];
}

const OPTIONS_TAUX_TVA = [
  { value: '0', label: '0 %' },
  { value: '2.1', label: '2,1 %' },
  { value: '5.5', label: '5,5 %' },
  { value: '10', label: '10 %' },
  { value: '13', label: '13 %' },
  { value: '20', label: '20 %' },
];

export default function FicheFacture() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [facture, setFacture] = useState<Facture | null>(null);
  const [form, setForm] = useState<Facture | null>(null);
  const [lignes, setLignes] = useState<LigneAlimentForm[]>([]);
  const [lignesCarburant, setLignesCarburant] = useState<LigneCarburantForm[]>([]);
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);
  const [montantTexte, setMontantTexte] = useState('');

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<{ titre: string; message?: string } | null>(null);

  const estAlimentation = facture?.categorieDepense === 'alimentation';
  const totalAlimentation = lignes.reduce((s, l) => s + (Number(l.montant.replace(',', '.')) || 0), 0);

  const estCarburant = facture?.categorieDepense === 'carburant';
  const totalCarburant = lignesCarburant.reduce((s, l) => s + (Number(l.montant.replace(',', '.')) || 0), 0);

  const majLigne = (key: string, patch: Partial<LigneAlimentForm>) => {
    setLignes((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const supprimerLigne = (key: string) => {
    setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const majLigneCarburant = (key: string, patch: Partial<LigneCarburantForm>) => {
    setLignesCarburant((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const supprimerLigneCarburant = (key: string) => {
    setLignesCarburant((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const setFournisseurId = (id: string) => {
    const fournisseur = fournisseurs.find((f) => f.id === id);

    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tiers: fournisseur?.nomEntreprise ?? '',
      };
    });
  };

  const setClientId = (id: string) => {
    const client = clients.find((c) => c.id === id);

    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tiers: client ? `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}` : '',
      };
    });
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
    setLignesCarburant(f ? versLignesCarburantForm(f) : []);
    setMontantTexte(f ? String(f.montant).replace('.', ',') : '');
    setComptes(await listComptesPcg());
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
      listFournisseurs().then(setFournisseurs);
      listClients().then(setClients);
    }, [charger]),
  );

  // ---------------------------------------------------------------------------
  // ENREGISTREMENT
  // ---------------------------------------------------------------------------

 const enregistrerModifications = async () => {
  if (!form) return;

  if (!form.tiers.trim()) {
    setErreur({
      titre: form.type === 'recue' ? 'Fournisseur requis' : 'Client requis',
    });
    return;
  }

  let aEnregistrer = form;

  if (estAlimentation) {
    const lignesFinales = lignes
      .map((l) => {
        const estConditionne = TYPES_ALIMENT_CONDITIONNES.includes(l.type);
        const nombreUnites = estConditionne
          ? Number(l.nombreUnitesConditionnement.replace(',', '.')) || undefined
          : undefined;
        return {
          type: l.type,
          montant: Number(l.montant.replace(',', '.')),
          quantiteKg: estConditionne
            ? nombreUnites
              ? nombreUnites * POIDS_UNITE_CONDITIONNEMENT[l.uniteConditionnement]
              : undefined
            : Number(l.quantiteKg.replace(',', '.')) || undefined,
          typeLibre:
            l.type === 'autre'
              ? l.typeLibre.trim() || undefined
              : undefined,
          uniteConditionnement: estConditionne ? l.uniteConditionnement : undefined,
          nombreUnitesConditionnement: nombreUnites,
        };
      })
      .filter((l) => l.montant > 0);

    if (lignesFinales.length === 0) {
      setErreur({
        titre: 'Montant invalide',
        message: 'Ajoutez au moins un montant pour un aliment.',
      });
      return;
    }

    aEnregistrer = {
      ...form,
      montant: totalAlimentation,
      lignesAlimentation: lignesFinales,
    };

  } else if (estCarburant) {
    const lignesCarburantFinales = lignesCarburant
      .map((l) => ({
        type: l.type,
        montant: Number(l.montant.replace(',', '.')),
        litrage: Number(l.litrage.replace(',', '.')) || undefined,
      }))
      .filter((l) => l.montant > 0);

    if (lignesCarburantFinales.length === 0) {
      setErreur({
        titre: 'Montant invalide',
        message: 'Ajoutez au moins un montant pour un carburant.',
      });
      return;
    }

    aEnregistrer = {
      ...form,
      montant: totalCarburant,
      lignesCarburant: lignesCarburantFinales,
    };

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

    setErreur({
      titre: 'Erreur',
      message: "Impossible d'enregistrer les modifications.",
    });
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

  const compteAffiche = facture.categorieDepense
    ? facture.categorieDepense === 'autre' && facture.compteManuel
      ? (comptes.find((c) => c.numero === facture.compteManuel) ?? COMPTE_PAR_DEPENSE.autre)
      : COMPTE_PAR_DEPENSE[facture.categorieDepense]
    : facture.categorieRecette
      ? facture.categorieRecette === 'autre' && facture.compteManuel
        ? (comptes.find((c) => c.numero === facture.compteManuel) ?? COMPTE_PAR_RECETTE.autre)
        : COMPTE_PAR_RECETTE[facture.categorieRecette]
      : undefined;

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

            <Text style={styles.line}>
              TVA : {facture.tauxTva} %
            </Text>


            {facture.description ? (
              <Text style={styles.line}>
                N° de facture : {facture.description}
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

            {compteAffiche ? (
              <Text style={styles.line}>
                Compte PCG : {compteAffiche.numero} — {compteAffiche.libelle}
              </Text>
            ) : null}

            {facture.lignesAlimentation && facture.lignesAlimentation.length > 0 ? (
              <View style={styles.detailsBloc}>
                <Text style={styles.detailsTitre}>Détails :</Text>
                {facture.lignesAlimentation.map((ligne, index) => (
                  <View key={index} style={styles.detailsLigne}>
                    <Text style={styles.line}>
                      {ligne.type === 'autre' && ligne.typeLibre ? ligne.typeLibre : LABEL_TYPE_ALIMENT[ligne.type]}
                      {ligne.nombreUnitesConditionnement && ligne.uniteConditionnement
                        ? ` — ${ligne.nombreUnitesConditionnement} ${LABEL_UNITE_CONDITIONNEMENT[ligne.uniteConditionnement].toLowerCase()}${ligne.nombreUnitesConditionnement > 1 ? 's' : ''}`
                        : ''}
                    </Text>
                    <Text style={styles.detailsMontant}>{formatMontant(ligne.montant)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {facture.lignesCarburant && facture.lignesCarburant.length > 0 ? (
              <View style={styles.detailsBloc}>
                <Text style={styles.detailsTitre}>Détails :</Text>
                {facture.lignesCarburant.map((ligne, index) => (
                  <View key={index} style={styles.detailsLigne}>
                    <Text style={styles.line}>
                      {LABEL_TYPE_CARBURANT[ligne.type]}
                      {ligne.litrage !== undefined ? ` — ${ligne.litrage} L` : ''}
                    </Text>
                    <Text style={styles.detailsMontant}>{formatMontant(ligne.montant)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <>
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
              </>
            )}

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

            <View style={styles.rowFin}>
              <View style={styles.flex1}>
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
              </View>
              <View style={styles.flex1}>
                <FormField
                  label="N° Facture"
                  value={form.description ?? ''}
                  onChangeText={(description) =>
                    setForm({
                      ...form,
                      description,
                    })
                  }
                  placeholder="N° Facture"
                />
              </View>
            </View>

            {form.type === 'recue' ? (
              <View style={styles.rowFin}>
                <View style={styles.flex1}>
                  <SelectField
                    label="Fournisseur"
                    required
                    searchable
                    placeholder="Choix du fournisseur"
                    value={
                      fournisseurs.find((f) => f.nomEntreprise === form.tiers)?.id ?? ''
                    }
                    onChange={setFournisseurId}
                    options={fournisseurs.map((f) => ({
                      value: f.id,
                      label: f.nomEntreprise,
                    }))}
                  />
                </View>

                <Pressable
                  style={styles.boutonIcone}
                  onPress={() => router.push('/comptabilite/fournisseurs')}
                >
                  <Ionicons name="pencil" size={20} color={colors.ajout} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.rowFin}>
                <View style={styles.flex1}>
                  <SelectField
                    label="Client"
                    required
                    searchable
                    placeholder="Choix du client"
                    value={
                      clients.find((c) => `${c.nom}${c.prenom ? ` ${c.prenom}` : ''}` === form.tiers)?.id ?? ''
                    }
                    onChange={setClientId}
                    options={clients.map((c) => ({
                      value: c.id,
                      label: `${c.nom}${c.prenom ? ` ${c.prenom}` : ''}`,
                    }))}
                  />
                </View>

                <Pressable
                  style={styles.boutonIcone}
                  onPress={() => router.push('/comptabilite/clients')}
                >
                  <Ionicons name="pencil" size={20} color={colors.ajout} />
                </Pressable>
              </View>
            )}

            {estAlimentation ? (
              <>
                <Card style={styles.lignesCard}>
                  <View style={styles.lignesEnTete}>
                    <Text style={styles.lignesTitre}>Détail par aliment</Text>
                    <Pressable
                      style={styles.boutonAjoutAliment}
                      onPress={() =>
                        setLignes((prev) => [
                          ...prev,
                          {
                            key: generateId(),
                            type: 'foin',
                            montant: '',
                            quantiteKg: '',
                            typeLibre: '',
                            uniteConditionnement: 'matela',
                            nombreUnitesConditionnement: '',
                          },
                        ])
                      }
                    >
                      <Ionicons name="add-circle" size={28} color={colors.ajout} />
                    </Pressable>
                  </View>

                  {lignes.map((ligne, index) => (
                    <View key={ligne.key} style={styles.ligneBloc}>
                      <View style={styles.ligneRow}>
                        <View style={styles.ligneMontant}>
                          <SelectField
                            label={`Aliment ${index + 1}`}
                            value={ligne.type}
                            onChange={(v) => majLigne(ligne.key, { type: v })}
                            options={Object.entries(LABEL_TYPE_ALIMENT).map(
                              ([value, label]) => ({
                                value: value as TypeAliment,
                                label,
                              }),
                            )}
                          />
                        </View>
                        {!TYPES_ALIMENT_CONDITIONNES.includes(ligne.type) && (
                          <View style={styles.ligneMontant}>
                            <FormField
                              label="Quantité (kg)"
                              value={ligne.quantiteKg}
                              onChangeText={(v) =>
                                majLigne(ligne.key, { quantiteKg: v })
                              }
                              keyboardType="decimal-pad"
                              placeholder="ex: 100"
                            />
                          </View>
                        )}
                        <View style={styles.ligneMontant}>
                          <FormField
                            label="Montant TTC"
                            value={ligne.montant}
                            onChangeText={(v) =>
                              majLigne(ligne.key, { montant: v })
                            }
                            keyboardType="decimal-pad"
                            placeholder="ex: 120"
                          />
                        </View>
                        {lignes.length > 1 && (
                          <Pressable style={styles.boutonAjoutAliment} onPress={() => supprimerLigne(ligne.key)}>
                            <Ionicons name="close-circle" size={28} color={colors.danger} />
                          </Pressable>
                        )}
                      </View>
                      {TYPES_ALIMENT_CONDITIONNES.includes(ligne.type) && (
                        <>
                          <View style={styles.ligneRow}>
                            <View style={styles.ligneMontant}>
                              <FormField
                                label="Nombre"
                                value={ligne.nombreUnitesConditionnement}
                                onChangeText={(v) => majLigne(ligne.key, { nombreUnitesConditionnement: v })}
                                keyboardType="decimal-pad"
                                placeholder="ex: 3"
                              />
                            </View>
                            <View style={styles.ligneMontant}>
                              <SelectField
                                label="Unité"
                                value={ligne.uniteConditionnement}
                                onChange={(v) => majLigne(ligne.key, { uniteConditionnement: v })}
                                options={Object.entries(LABEL_UNITE_CONDITIONNEMENT).map(([value, label]) => ({
                                  value: value as UniteConditionnement,
                                  label,
                                }))}
                              />
                            </View>
                          </View>
                          {ligne.nombreUnitesConditionnement ? (
                            <Text style={styles.conditionnementApprox}>
                              ≈{' '}
                              {Math.round(
                                (Number(ligne.nombreUnitesConditionnement.replace(',', '.')) || 0) *
                                  POIDS_UNITE_CONDITIONNEMENT[ligne.uniteConditionnement],
                              )}{' '}
                              kg
                            </Text>
                          ) : null}
                        </>
                      )}
                      {ligne.type === 'autre' && (
                        <FormField
                          value={ligne.typeLibre}
                          onChangeText={(v) =>
                            majLigne(ligne.key, { typeLibre: v })
                          }
                          placeholder="Préciser — ex: Frais de livraison, compléments…"
                        />
                      )}
                    </View>
                  ))}
                </Card>
                <Text style={styles.totalAlimentation}>
                  Total facture TTC : {totalAlimentation.toFixed(2).replace('.', ',')} €
                </Text>
                <SelectField
                  label="Taux de TVA"
                  value={form.tauxTva?.toString() ?? ''}
                  onChange={(value) =>
                    setForm((prev) => {
                      if (!prev) return prev;

                      return {
                        ...prev,
                        tauxTva: value === '' ? undefined : Number(value),
                      };
                    })
                  }
                  options={OPTIONS_TAUX_TVA}
                />
              </>
            ) : estCarburant ? (
              <>
                <Card style={styles.lignesCard}>
                  <View style={styles.lignesEnTete}>
                    <Text style={styles.lignesTitre}>Détail par carburant</Text>
                    <Pressable
                      style={styles.boutonAjoutAliment}
                      onPress={() =>
                        setLignesCarburant((prev) => [
                          ...prev,
                          { key: generateId(), type: 'gazoil', montant: '', litrage: '' },
                        ])
                      }
                    >
                      <Ionicons name="add-circle" size={28} color={colors.ajout} />
                    </Pressable>
                  </View>

                  {lignesCarburant.map((ligne, index) => (
                    <View key={ligne.key} style={styles.ligneRow}>
                      <View style={styles.ligneMontant}>
                        <SelectField
                          label={`Type ${index + 1}`}
                          value={ligne.type}
                          onChange={(v) => majLigneCarburant(ligne.key, { type: v })}
                          options={Object.entries(LABEL_TYPE_CARBURANT).map(([value, label]) => ({ value: value as TypeCarburant, label }))}
                        />
                      </View>
                      <View style={styles.ligneMontant}>
                        <FormField
                          label="Litrage (L)"
                          value={ligne.litrage}
                          onChangeText={(v) => majLigneCarburant(ligne.key, { litrage: v })}
                          keyboardType="decimal-pad"
                          placeholder="ex:40"
                        />
                      </View>
                      <View style={styles.ligneMontant}>
                        <FormField
                          label="Montant TTC"
                          value={ligne.montant}
                          onChangeText={(v) => majLigneCarburant(ligne.key, { montant: v })}
                          keyboardType="decimal-pad"
                          placeholder="ex: 60"
                        />
                      </View>
                      {lignesCarburant.length > 1 && (
                        <Pressable style={styles.boutonAjoutAliment} onPress={() => supprimerLigneCarburant(ligne.key)}>
                          <Ionicons name="close-circle" size={28} color={colors.danger} />
                        </Pressable>
                      )}
                    </View>
                  ))}
                </Card>
                <Text style={styles.totalAlimentation}>
                  Total facture TTC : {totalCarburant.toFixed(2).replace('.', ',')} €
                </Text>
                <SelectField
                  label="Taux de TVA"
                  value={form.tauxTva?.toString() ?? ''}
                  onChange={(value) =>
                    setForm((prev) => {
                      if (!prev) return prev;

                      return {
                        ...prev,
                        tauxTva: value === '' ? undefined : Number(value),
                      };
                    })
                  }
                  options={OPTIONS_TAUX_TVA}
                />
              </>
            ) : (
              <View style={styles.champsRow}>
                <View style={styles.champ}>
                  <FormField
                    label="Montant"
                    value={montantTexte}
                    onChangeText={(value) => {
                      if (!/^\d*[,.]?\d*$/.test(value)) return;
                      setMontantTexte(value);
                      const texte = value.replace(',', '.');
                      setForm({
                        ...form,
                        montant: texte === '' || texte === '.' ? 0 : Number(texte) || 0,
                      });
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                  />
                </View>

                <View style={styles.champ}>
                  <SelectField
                    label="Taux de TVA"
                    value={form.tauxTva?.toString() ?? ''}
                    onChange={(value) =>
                      setForm((prev) => {
                        if (!prev) return prev;

                        return {
                          ...prev,
                          tauxTva: value === '' ? undefined : Number(value),
                        };
                      })
                    }
                    options={OPTIONS_TAUX_TVA}
                  />
                </View>
              </View>
            )}

            <View style={styles.row}>
              <Button
                style={styles.flex1}
                variant="secondary"
                label="Annuler"
                onPress={() => {
                  setForm(facture);
                  setLignes(versLignesForm(facture));
                  setLignesCarburant(versLignesCarburantForm(facture));
                  setMontantTexte(String(facture.montant).replace('.', ','));
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

  detailsBloc: {
    gap: 2,
  },

  detailsTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },

  detailsLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailsMontant: {
    fontSize: 14,
    fontWeight: '600',
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
  lignesEnTete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lignesTitre: { fontSize: 14, fontWeight: '700', color: colors.text },
  boutonAjoutAliment: { padding: 2 },
  ligneBloc: { gap: 8 },
  ligneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  ligneMontant: { flex: 1 },
  totalAlimentation: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  conditionnementApprox: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  champsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  champ: {
    flex: 1,
  },

  rowFin: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  boutonIcone: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ajoutBadgeBg,
  },
});
