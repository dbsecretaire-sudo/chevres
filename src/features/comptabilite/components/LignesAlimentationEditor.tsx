import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { especeCourante, especesActives, plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { TYPE_ALIMENT } from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';

interface Props {
  lignes: LigneAlimentForm[];
  onChange: (lignes: LigneAlimentForm[]) => void;
  /** Activité de la facture : le cheptel des lignes qui n'en précisent pas (et qui fixe leurs aliments). */
  activite: ActiviteComptable;
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
export function LignesAlimentationEditor({ lignes, onChange, activite }: Props) {
  const router = useRouter();
  const retour = useAdresseCourante();
  const especeFacture = activite === ACTIVITE_COMMUNE ? especeCourante() : activite;
  const [stock, setStock] = useState<ArchiveStock>(ARCHIVE_VIDE);

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

  /** Les aliments proposés pour une espèce : ceux d'office, puis ceux ajoutés au stock (valeur : type, ou « ajoute:nom »). */
  const optionsAliments = (espece: Parameters<typeof typesAlimentEspece>[0], ligne: LigneAlimentForm) => {
    const options = articlesDuGenre(GENRE_ARTICLE.ALIMENT, stock, espece).map((a) => ({
      value: a.id ? `${PREFIXE_AJOUTE}${a.libelle}` : a.cle.split(':')[1],
      label: a.libelle,
    }));
    // Une ancienne saisie libre (« autre » avec son texte) reste affichée tant qu'on ne la change pas.
    const courante = valeurDe(ligne);
    if (courante.startsWith(PREFIXE_AJOUTE) && !options.some((o) => o.value === courante)) {
      options.push({ value: courante, label: ligne.typeLibre });
    }
    return options;
  };

  return (
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineBold}>
          {TEXTES.comptabilite.lignesAlimentationEditor.detailParAliment}
        </Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() => onChange([...lignes, ligneAlimentVide(typesAlimentEspece(especeFacture)[0])])}
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>

      {lignes.map((ligne, index) => {
        const estConditionne = TYPES_ALIMENT_CONDITIONNES.includes(ligne.type);
        const espece = ligne.activite || especeFacture;
        return (
          <View key={ligne.key} style={commonStyles.gap8}>
            <View style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.lineSemiBold}>
                {TEXTES.comptabilite.lignesAlimentationEditor.alimentValeur(index + 1)}
              </Text>
              {plusieursEspeces() && (
                <SelectLien
                  label={TEXTES.comptabilite.lignesAlimentationEditor.cheptelConcerne}
                  value={espece}
                  onChange={(v) =>
                    maj(ligne.key, {
                      activite: v === especeFacture ? '' : v,
                      // Un aliment d'office d'une autre espèce est remplacé ; un aliment ajouté au stock vaut pour toutes.
                      ...(ligne.type === TYPE_ALIMENT.AUTRE || typesAlimentEspece(v).includes(ligne.type)
                        ? {}
                        : { type: typesAlimentEspece(v)[0] }),
                    })
                  }
                  options={especesActives().map((e) => ({
                    value: e,
                    label: LABEL_ACTIVITE_COMPTABLE[e],
                  }))}
                />
              )}
            </View>
            <SelectFieldEditable<string>
              label={TEXTES.comptabilite.lignesAlimentationEditor.alimentValeur(index + 1)}
              libelleCache
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
              onEdit={() => router.push(ROUTES.stockDepuis(retour, 'aliments', espece))}
            />
            <View style={commonStyles.rowFin}>
              {!estConditionne && (
                <View style={commonStyles.flex1}>
                  <FormField
                    label={TEXTES.comptabilite.lignesAlimentationEditor.quantiteKg}
                    value={ligne.quantiteKg}
                    onChangeText={(v) => maj(ligne.key, { quantiteKg: v })}
                    keyboardType="decimal-pad"
                    placeholder={TEXTES.comptabilite.lignesAlimentationEditor.ex100}
                  />
                </View>
              )}
              <View style={commonStyles.flex1}>
                <FormField
                  label={TEXTES.commun.general.montantTtc}
                  value={ligne.montant}
                  onChangeText={(v) => maj(ligne.key, { montant: v })}
                  keyboardType="decimal-pad"
                  placeholder={TEXTES.comptabilite.lignesAlimentationEditor.ex120}
                />
              </View>
              {lignes.length > 1 && (
                <Pressable style={commonStyles.boutonPastille} onPress={() => supprimer(ligne.key)}>
                  <Ionicons name="close-circle" size={28} color={colors.danger} />
                </Pressable>
              )}
            </View>

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
          </View>
        );
      })}
    </Card>
  );
}

/** La valeur du choix d'une ligne : son type d'office, ou « ajoute:nom » pour un aliment ajouté au stock. */
const valeurDe = (ligne: LigneAlimentForm): string =>
  ligne.type === TYPE_ALIMENT.AUTRE ? `${PREFIXE_AJOUTE}${ligne.typeLibre}` : ligne.type;
