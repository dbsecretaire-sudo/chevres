import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectLien } from '@/shared/components/SelectLien';
import { colors } from '@/shared/theme/colors';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ligneAlimentVide, type LigneAlimentForm } from '@/features/comptabilite/forms/lignesAlimentation';
import {
  LABEL_ACTIVITE_COMPTABLE,
  LABEL_TYPE_ALIMENT,
  LABEL_UNITE_CONDITIONNEMENT,
} from '@/shared/textes/libelles';
import { POIDS_UNITE_CONDITIONNEMENT, TYPES_ALIMENT_CONDITIONNES } from '@/shared/constants/planComptable';
import type { ActiviteComptable, UniteConditionnement } from '@/features/comptabilite/types';
import { typesAlimentEspece } from '@/features/comptabilite/utils/alimentation';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { especeCourante, especesActives, plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { TYPE_ALIMENT } from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';

interface Props {
  lignes: LigneAlimentForm[];
  onChange: (lignes: LigneAlimentForm[]) => void;
  /** Activité de la facture : le cheptel des lignes qui n'en précisent pas (et qui fixe leurs aliments). */
  activite: ActiviteComptable;
}

/** Carte « Détail par aliment » : une facture d'alimentation peut regrouper plusieurs aliments. */
export function LignesAlimentationEditor({ lignes, onChange, activite }: Props) {
  const especeFacture = activite === ACTIVITE_COMMUNE ? especeCourante() : activite;
  const maj = (key: string, patch: Partial<LigneAlimentForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const supprimer = (key: string) =>
    onChange(lignes.length > 1 ? lignes.filter((l) => l.key !== key) : lignes);

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
        const types = typesAlimentEspece(espece);
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
                      type: typesAlimentEspece(v).includes(ligne.type)
                        ? ligne.type
                        : typesAlimentEspece(v)[0],
                    })
                  }
                  options={especesActives().map((e) => ({
                    value: e,
                    label: LABEL_ACTIVITE_COMPTABLE[e],
                  }))}
                />
              )}
            </View>
            <View style={commonStyles.rowFin}>
              <View style={commonStyles.flex1}>
                <SelectField
                  label={TEXTES.comptabilite.lignesAlimentationEditor.alimentValeur(index + 1)}
                  value={ligne.type}
                  onChange={(v) => maj(ligne.key, { type: v })}
                  libelleCache
                  options={types.map((type) => ({ value: type, label: LABEL_TYPE_ALIMENT[type] }))}
                />
              </View>
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

            {ligne.type === TYPE_ALIMENT.AUTRE && (
              <FormField
                value={ligne.typeLibre}
                onChangeText={(v) => maj(ligne.key, { typeLibre: v })}
                placeholder={TEXTES.comptabilite.lignesAlimentationEditor.preciserExFraisDeLivraisonPoints}
              />
            )}
          </View>
        );
      })}
    </Card>
  );
}
