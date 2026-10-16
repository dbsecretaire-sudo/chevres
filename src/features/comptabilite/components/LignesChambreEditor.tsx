import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { Button } from '@/shared/components/Button';
import { ligneChambreVide, type LigneChambreForm } from '@/features/comptabilite/forms/lignesChambre';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.fournisseurs.chambre;

interface Props {
  lignes: LigneChambreForm[];
  onChange: (lignes: LigneChambreForm[]) => void;
}

/**
 * Les articles d'une facture de la Chambre d'agriculture (forfait d'identification, équarrissage ATM, conseils et analyses) : le nom et
 * le montant TTC de chacun. Les articles proposés se modifient, se retirent, et on en ajoute d'autres.
 */
export function LignesChambreEditor({ lignes, onChange }: Props) {
  const maj = (key: string, changement: Partial<LigneChambreForm>) =>
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...changement } : l)));

  return (
    <Card style={commonStyles.gap10}>
      <Text style={commonStyles.lineBold}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {lignes.map((ligne) => (
        <View key={ligne.key} style={commonStyles.gap8}>
          <View style={commonStyles.rowFin}>
            <View style={commonStyles.flex2}>
              <FormField
                label={T.article}
                value={ligne.libelle}
                onChangeText={(libelle) => maj(ligne.key, { libelle })}
              />
            </View>
            <View style={commonStyles.flex1}>
              <FormField
                label={T.montant}
                value={ligne.montant}
                onChangeText={(montant) => maj(ligne.key, { montant })}
                keyboardType="decimal-pad"
                placeholder="0,00"
              />
            </View>
            <Pressable
              style={commonStyles.boutonPastille}
              onPress={() => onChange(lignes.filter((l) => l.key !== ligne.key))}
              accessibilityLabel={T.retirer}
            >
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      ))}
      <Button
        variant="secondary"
        label={T.ajouter}
        onPress={() => onChange([...lignes, ligneChambreVide()])}
      />
    </Card>
  );
}
