import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ligneCarburantVide, type LigneCarburantForm } from '@/features/comptabilite/forms/lignesCarburant';
import { LABEL_TYPE_CARBURANT } from '@/shared/textes/libelles';
import type { TypeCarburant } from '@/features/comptabilite/types';
import { TEXTES } from '@/shared/textes';

interface Props {
  lignes: LigneCarburantForm[];
  onChange: (lignes: LigneCarburantForm[]) => void;
}

/** Carte « Détail par carburant » : une facture de carburant peut regrouper plusieurs pleins/types. */
export function LignesCarburantEditor({ lignes, onChange }: Props) {
  const maj = (key: string, patch: Partial<LigneCarburantForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const supprimer = (key: string) =>
    onChange(lignes.length > 1 ? lignes.filter((l) => l.key !== key) : lignes);

  return (
    <Card style={commonStyles.gap10}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineBold}>
          {TEXTES.comptabilite.lignesCarburantEditor.detailParCarburant}
        </Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() => onChange([...lignes, ligneCarburantVide()])}
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>

      {lignes.map((ligne, index) => (
        <View key={ligne.key} style={commonStyles.rowFin}>
          <View style={commonStyles.flex1}>
            <SelectField
              label={TEXTES.comptabilite.lignesCarburantEditor.typeValeur(index + 1)}
              value={ligne.type}
              onChange={(v) => maj(ligne.key, { type: v })}
              options={Object.entries(LABEL_TYPE_CARBURANT).map(([value, label]) => ({
                value: value as TypeCarburant,
                label,
              }))}
            />
          </View>
          <View style={commonStyles.flex1}>
            <FormField
              label={TEXTES.comptabilite.lignesCarburantEditor.litrageL}
              value={ligne.litrage}
              onChangeText={(v) => maj(ligne.key, { litrage: v })}
              keyboardType="decimal-pad"
              placeholder={TEXTES.comptabilite.lignesCarburantEditor.ex40}
            />
          </View>
          <View style={commonStyles.flex1}>
            <FormField
              label={TEXTES.commun.general.montantTtc}
              value={ligne.montant}
              onChangeText={(v) => maj(ligne.key, { montant: v })}
              keyboardType="decimal-pad"
              placeholder={TEXTES.comptabilite.lignesCarburantEditor.ex60}
            />
          </View>
          {lignes.length > 1 && (
            <Pressable style={commonStyles.boutonPastille} onPress={() => supprimer(ligne.key)}>
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </Pressable>
          )}
        </View>
      ))}
    </Card>
  );
}
