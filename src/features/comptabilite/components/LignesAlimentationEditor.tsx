import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { SelectLien } from '@/shared/components/SelectLien';
import { colors } from '@/shared/theme/colors';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ligneAlimentVide, type LigneAlimentForm } from '@/features/comptabilite/forms/lignesAlimentation';
import { LABEL_ACTIVITE_COMPTABLE, LABEL_UNITE_CONDITIONNEMENT } from '@/shared/textes/libelles';
import { POIDS_UNITE_CONDITIONNEMENT, TYPES_ALIMENT_CONDITIONNES } from '@/shared/constants/planComptable';
import type { ActiviteComptable, TypeAliment, UniteConditionnement } from '@/features/comptabilite/types';
import { typesAlimentEspece } from '@/features/comptabilite/utils/alimentation';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { CHOIX_EQUIPEMENT, CHOIX_MATERIEL, GENRE_ARTICLE, SECTION_STOCK } from '@/shared/constants/stock';
import { especeCourante, especesActives, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { TYPE_ALIMENT } from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';
import { BoutonCadeau } from '@/features/comptabilite/components/BoutonCadeau';
import { ChoixPastilles } from '@/shared/components/ChoixPastilles';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { formatMontant } from '@/shared/utils/dates';

interface Props {
  lignes: LigneAlimentForm[];
  onChange: (lignes: LigneAlimentForm[]) => void;
  /** Activité de la facture : le cheptel des lignes qui n'en précisent pas (et qui fixe leurs aliments). */
  activite: ActiviteComptable;
  /** La dépense est offerte par le fournisseur : chaque ligne a son bouton « Cadeau ». */
  offerte?: boolean;
  /** Le taux proposé pour un nouvel achat (celui de la facture) ; chaque achat garde le sien. */
  tauxDefaut?: number;
  /** Ce qui identifie la facture sous le titre d'un achat (le client, le numéro de facture). */
  sousTitre?: string;
}

/** Début de la valeur d'un aliment ajouté au stock (suivie de son nom) : il s'enregistre comme « autre » avec ce nom. */
const PREFIXE_AJOUTE = 'ajoute:';

const ARCHIVE_VIDE: ArchiveStock = {
  mouvements: [],
  articles: [],
  conditionnements: {},
  ordres: {},
  noms: {},
  lait: [],
  prix: {},
};

/**
 * Carte « Détail par aliment » : une facture d'alimentation peut regrouper plusieurs aliments. Chaque aliment se choisit
 * (avec recherche) dans la liste du stock — ceux d'office de l'espèce, puis ceux qu'on y a ajoutés ; le crayon mène au
 * stock et la liste s'y met à jour.
 */
export function LignesAlimentationEditor({ lignes, onChange, activite, offerte, tauxDefaut, sousTitre }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const especeFacture = activite === ACTIVITE_COMMUNE ? especeCourante() : activite;
  const [stock, setStock] = useState<ArchiveStock>(ARCHIVE_VIDE);
  /** L'achat dont la fiche est ouverte (un appui sur sa carte) ; les autres restent réduits à leur carte. */
  const [ouverte, setOuverte] = useState<string | null>(null);
  /** Les achats tels qu'ils étaient à l'ouverture de la fiche : Annuler les y remet. */
  const [avantOuverture, setAvantOuverture] = useState<LigneAlimentForm[] | null>(null);
  const fermer = (annuler: boolean) => {
    if (annuler && avantOuverture) onChange(avantOuverture);
    setOuverte(null);
    setAvantOuverture(null);
  };

  // La liste est relue à chaque retour sur l'écran : ce qu'on vient d'ajouter ou de renommer au stock y apparaît.
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then(setStock);
    }, []),
  );

  const maj = (key: string, patch: Partial<LigneAlimentForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const supprimer = (key: string) =>
    onChange(lignes.length > 1 ? lignes.filter((l) => l.key !== key) : lignes);

  /** Le matériel du stock (celui du bâtiment : grillage, poteaux…, pas l'équipement de fromagerie). */
  const materielDuStock = () => articlesDuGenre(GENRE_ARTICLE.BATIMENT, stock, especeFacture);
  /** Une ligne de matériel : choisie comme telle dans la liste des cheptels, ou dont le nom est celui d'un matériel du stock. */
  /** L'équipement consommable du stock (gants, filtres…). */
  const equipementDuStock = () => articlesDuGenre(GENRE_ARTICLE.EQUIPEMENT, stock, especeFacture);
  const estEquipement = (ligne: LigneAlimentForm) =>
    !!ligne.equipement ||
    (ligne.type === TYPE_ALIMENT.AUTRE && equipementDuStock().some((a) => a.libelle === ligne.typeLibre));
  const estMateriel = (ligne: LigneAlimentForm) =>
    !!ligne.materiel ||
    (ligne.type === TYPE_ALIMENT.AUTRE && materielDuStock().some((a) => a.libelle === ligne.typeLibre));

  /** Le titre d'une ligne : « Aliment 1 », « Matériel 2 » ou « Équipement 3 ». */
  const titreDeLaLigne = (ligne: LigneAlimentForm) =>
    estEquipement(ligne)
      ? TEXTES.comptabilite.lignesAlimentationEditor.equipementValeur
      : estMateriel(ligne)
        ? TEXTES.comptabilite.lignesAlimentationEditor.materielValeur
        : TEXTES.comptabilite.lignesAlimentationEditor.alimentValeur;

  /** Les aliments proposés pour une espèce : ceux d'office, puis ceux ajoutés au stock (valeur : type, ou « ajoute:nom »). */
  const optionsAliments = (espece: Parameters<typeof typesAlimentEspece>[0], ligne: LigneAlimentForm) => {
    // Une ligne de matériel ou d'équipement (choisie comme telle dans la liste des cheptels) ne propose que cela ; sinon, que les aliments.
    const autre = estMateriel(ligne) || estEquipement(ligne);
    const options = (
      estEquipement(ligne)
        ? equipementDuStock()
        : estMateriel(ligne)
          ? materielDuStock()
          : articlesDuGenre(GENRE_ARTICLE.ALIMENT, stock, espece)
    ).map((a) => ({
      value: a.id || autre ? `${PREFIXE_AJOUTE}${a.libelle}` : a.cle.split(':')[1],
      label: a.libelle,
    }));
    // Une ancienne saisie libre (« autre » avec son texte) reste affichée tant qu'on ne la change pas.
    const courante = valeurDe(ligne);
    if (courante.startsWith(PREFIXE_AJOUTE) && !options.some((o) => o.value === courante)) {
      options.push({ value: courante, label: ligne.typeLibre });
    }
    return options;
  };

  /** Le nom d'un achat, tel qu'il se choisit dans la liste (ou son texte libre). */
  const nomDeLaLigne = (ligne: LigneAlimentForm) =>
    optionsAliments(ligne.activite || especeFacture, ligne).find((o) => o.value === valeurDe(ligne))?.label ??
    ligne.typeLibre;

  /** Le détail d'un achat sur sa carte : la quantité, le montant TTC et le taux de TVA. */
  const detailDeLaLigne = (ligne: LigneAlimentForm) => {
    const montant = parseDecimal(ligne.montant);
    const taux = ligne.tauxTva ?? tauxDefaut;
    return [
      ligne.quantiteKg ? `${ligne.quantiteKg} kg` : '',
      montant ? `${formatMontant(montant)} TTC` : '',
      taux ? `TVA ${taux} %` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  };

  return (
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineBold}>
          {TEXTES.comptabilite.lignesAlimentationEditor.detailParAliment}
        </Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() =>
            onChange([...lignes, { ...ligneAlimentVide(typesAlimentEspece(especeFacture)[0]), tauxTva: tauxDefaut }])
          }
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>

      {lignes.map((ligne, index) => {
        const estConditionne = TYPES_ALIMENT_CONDITIONNES.includes(ligne.type);
        const espece = ligne.activite || especeFacture;
        return (
          <View key={ligne.key} style={commonStyles.gap8}>
            {/* L'achat est une carte : son nom, et son détail dessous. Un appui ouvre la fiche de l'achat. */}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setAvantOuverture(lignes);
                setOuverte(ligne.key);
              }}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                backgroundColor: colors.surface,
                gap: 4,
              }}
            >
              <Text style={commonStyles.lineSemiBold}>{nomDeLaLigne(ligne) || titreDeLaLigne(ligne)(index + 1)}</Text>
              {detailDeLaLigne(ligne) ? <Text style={commonStyles.note}>{detailDeLaLigne(ligne)}</Text> : null}
            </Pressable>
            <Modal
              visible={ouverte === ligne.key}
              animationType="slide"
              onRequestClose={() => fermer(true)}
            >
              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retour"
                    onPress={() => fermer(true)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.title}>{`Article ${index + 1}`}</Text>
                    {sousTitre ? <Text style={commonStyles.muted}>{sousTitre}</Text> : null}
                  </View>
                </View>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineSemiBold}>{TEXTES.comptabilite.lignesAlimentationEditor.cheptelConcerne}</Text>
              <View style={commonStyles.headerDroite}>
                {/* Un seul lien : le cheptel concerné, ou « Matériel » (un investissement) ; ce qu'on choisit s'affiche ici. */}
                <SelectLien<string>
                  label={TEXTES.comptabilite.lignesAlimentationEditor.cheptelConcerne}
                  value={
                    estEquipement(ligne) ? CHOIX_EQUIPEMENT : estMateriel(ligne) ? CHOIX_MATERIEL : espece
                  }
                  onChange={(v) =>
                    maj(
                      ligne.key,
                      v === CHOIX_MATERIEL
                        ? // Un matériel ne dépend d'aucun animal : on choisit ensuite le matériel dans la liste.
                          { materiel: true, equipement: false, type: TYPE_ALIMENT.AUTRE, typeLibre: '' }
                        : v === CHOIX_EQUIPEMENT
                          ? { materiel: false, equipement: true, type: TYPE_ALIMENT.AUTRE, typeLibre: '' }
                          : {
                              materiel: false,
                              equipement: false,
                              activite: v === especeFacture ? '' : (v as EspeceAnimale),
                              // Un aliment d'office d'une autre espèce est remplacé ; un aliment ajouté au stock vaut pour toutes.
                              ...(estMateriel(ligne) || estEquipement(ligne)
                                ? { type: typesAlimentEspece(v as EspeceAnimale)[0], typeLibre: '' }
                                : ligne.type === TYPE_ALIMENT.AUTRE ||
                                    typesAlimentEspece(v as EspeceAnimale).includes(ligne.type)
                                  ? {}
                                  : { type: typesAlimentEspece(v as EspeceAnimale)[0] }),
                            },
                    )
                  }
                  options={[
                    {
                      value: CHOIX_MATERIEL,
                      label: TEXTES.stock.onglets.materiel,
                      groupe: TEXTES.comptabilite.lignesAlimentationEditor.investissement,
                    },
                    {
                      value: CHOIX_EQUIPEMENT,
                      label: TEXTES.stock.sections.materiel,
                      groupe: TEXTES.comptabilite.lignesAlimentationEditor.consommables,
                    },
                    ...especesActives().map((e) => ({
                      value: e as string,
                      label: LABEL_ACTIVITE_COMPTABLE[e],
                      groupe: TEXTES.comptabilite.lignesAlimentationEditor.cheptelConcerne,
                    })),
                  ]}
                />
                {lignes.length > 1 && (
                  <Pressable style={commonStyles.boutonPastille} onPress={() => supprimer(ligne.key)}>
                    <Ionicons name="close-circle" size={28} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            </View>
            <View style={commonStyles.rowFin}>
              <View style={commonStyles.flex2}>
                <SelectFieldEditable<string>
                  label="Article"
                  searchable
                  placeholder={TEXTES.comptabilite.lignesAlimentationEditor.choixAliment}
                  value={valeurDe(ligne)}
                  onChange={(v) =>
                    maj(
                      ligne.key,
                      v.startsWith(PREFIXE_AJOUTE)
                        ? { type: TYPE_ALIMENT.AUTRE, typeLibre: v.slice(PREFIXE_AJOUTE.length) }
                        : { type: v as TypeAliment, typeLibre: '' },
                    )
                  }
                  options={optionsAliments(espece, ligne)}
                  onEdit={() =>
                    router.push(
                      ROUTES.stockDepuis(
                        retour,
                        estEquipement(ligne)
                          ? SECTION_STOCK.EQUIPEMENT_CONSOMMABLE
                          : estMateriel(ligne)
                            ? SECTION_STOCK.MATERIEL
                            : SECTION_STOCK.ALIMENTS,
                        espece,
                      ),
                    )
                  }
                />
              </View>
              {!estConditionne && (
                <View style={commonStyles.flex1}>
                  <FormField
                    label={
                      estMateriel(ligne) || estEquipement(ligne)
                        ? TEXTES.comptabilite.lignesAlimentationEditor.quantiteCourt
                        : TEXTES.comptabilite.lignesAlimentationEditor.quantiteKgCourt
                    }
                    value={ligne.quantiteKg}
                    onChangeText={(v) => maj(ligne.key, { quantiteKg: v })}
                    keyboardType="decimal-pad"
                    placeholder={TEXTES.comptabilite.lignesAlimentationEditor.ex100}
                  />
                </View>
              )}
            </View>
            {/* Le taux de TVA de cet achat : il se choisit ligne par ligne ; le HTVA et le TTC s'en déduisent. */}
            <Text style={commonStyles.lineSemiBold}>TVA (%)</Text>
            <ChoixPastilles
              options={OPTIONS_TAUX_TVA}
              value={String(ligne.tauxTva ?? tauxDefaut ?? '')}
              onChange={(v) => maj(ligne.key, { tauxTva: Number(v) })}
            />
            <ChampsHtvaTtc
              montant={ligne.montant}
              taux={ligne.tauxTva ?? tauxDefaut ?? 0}
              onMontant={(v) => maj(ligne.key, { montant: v })}
            />
            {parseDecimal(ligne.montant) > 0 && parseDecimal(ligne.quantiteKg) > 0 ? (
              <Text style={commonStyles.note}>
                {`Soit ${formatMontant(parseDecimal(ligne.montant) / parseDecimal(ligne.quantiteKg))} le kg.`}
              </Text>
            ) : null}
            {/* Dépense offerte : le bouton « Cadeau » de la ligne (actif d'office : elle compte 0 € ; désactivé, elle est facturée). */}
            {offerte ? (
              <BoutonCadeau
                actif={ligne.offert !== false}
                onChange={(actif) => maj(ligne.key, { offert: actif ? undefined : false })}
                ligne={TEXTES.comptabilite.nouvelleEcriture.cadeauLigne}
              />
            ) : null}

            {estConditionne && (
              <>
                <View style={commonStyles.rowFin}>
                  <View style={commonStyles.flex1}>
                    <FormField
                      label={TEXTES.comptabilite.lignesAlimentationEditor.nombre}
                      value={ligne.nombreUnitesConditionnement}
                      onChangeText={(v) => maj(ligne.key, { nombreUnitesConditionnement: v })}
                      keyboardType="decimal-pad"
                      placeholder={TEXTES.comptabilite.lignesAlimentationEditor.ex3}
                    />
                  </View>
                  <View style={commonStyles.flex1}>
                    <SelectField
                      label={TEXTES.commun.general.unite}
                      value={ligne.uniteConditionnement}
                      onChange={(v) => maj(ligne.key, { uniteConditionnement: v })}
                      options={Object.entries(LABEL_UNITE_CONDITIONNEMENT).map(([value, label]) => ({
                        value: value as UniteConditionnement,
                        label,
                      }))}
                    />
                  </View>
                </View>
                {ligne.nombreUnitesConditionnement ? (
                  <Text style={commonStyles.note}>
                    ≈{' '}
                    {Math.round(
                      parseDecimal(ligne.nombreUnitesConditionnement) *
                        POIDS_UNITE_CONDITIONNEMENT[ligne.uniteConditionnement],
                    )}{' '}
                    {TEXTES.commun.general.kg}
                  </Text>
                ) : null}
              </>
            )}
              <Pressable accessibilityRole="button" onPress={() => { supprimer(ligne.key); fermer(false); }}>
                <Text style={{ color: colors.danger, textDecorationLine: 'underline', textAlign: 'center' }}>
                  Supprimer cet article
                </Text>
              </Pressable>
              </ScrollView>
              <View style={[commonStyles.row, { padding: 16 }]}>
                <Button style={commonStyles.flex1} variant="secondary" label={TEXTES.commun.general.annuler} onPress={() => fermer(true)} />
                <Button style={commonStyles.flex1} label="Valider" onPress={() => fermer(false)} />
              </View>
            </Modal>
          </View>
        );
      })}
    </Card>
  );
}

/**
 * Le prix HTVA et le prix TTC d'un achat : celui qu'on tape, l'autre s'en déduit au taux de TVA choisi. Le TTC reste enregistré.
 */
function ChampsHtvaTtc({
  montant,
  taux,
  onMontant,
}: {
  montant: string;
  taux: number;
  onMontant: (montant: string) => void;
}) {
  // Le HTVA tapé à la main reste affiché pendant la saisie : il n'est recalculé qu'à partir du TTC.
  const [htTape, setHtTape] = useState<string | null>(null);
  const ttc = parseDecimal(montant);
  const ht = ttc ? ttc / (1 + taux / 100) : 0;
  return (
    <>
      <FormField
        label="Prix HTVA (€)"
        value={htTape ?? (ht ? ht.toFixed(2).replace('.', ',') : '')}
        onChangeText={(v) => {
          setHtTape(v);
          onMontant(String(Math.round(parseDecimal(v) * (1 + taux / 100) * 100) / 100));
        }}
        keyboardType="decimal-pad"
        placeholder="ex: 10"
      />
      <FormField
        label="Prix TTC (€)"
        value={montant}
        onChangeText={(v) => {
          setHtTape(null);
          onMontant(v);
        }}
        keyboardType="decimal-pad"
        placeholder="ex: 11,30"
      />
    </>
  );
}

/** La valeur du choix d'une ligne : son type d'office, ou « ajoute:nom » pour un aliment ajouté au stock. */
const valeurDe = (ligne: LigneAlimentForm): string =>
  ligne.type === TYPE_ALIMENT.AUTRE ? `${PREFIXE_AJOUTE}${ligne.typeLibre}` : ligne.type;
