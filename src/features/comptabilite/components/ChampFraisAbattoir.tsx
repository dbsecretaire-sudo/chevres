import { Text, View } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  /** Les frais d'abattoir à refacturer, tels qu'ils s'écrivent (avec virgule) : vides, il n'y en a pas. */
  valeur: string;
  /** Le taux de TVA des frais (vide : celui de la vente). */
  taux: string;
  onTaux: (taux: string) => void;
  tauxParDefaut: string;
  /** Le prix de la viande, sans les frais : le total de la facture s'affiche dessous. */
  montantViande: number;
}

/**
 * Les frais d'abattoir refacturés au client d'une vente de viande : le montant se lit seulement — il vient de la facture de l'abattoir
 * liée au lot d'abattoir (ou du montant noté sur le lot), et s'ajuste dans les Lots du cheptel — et son taux de TVA se choisit.
 */
export function ChampFraisAbattoir({ valeur, taux, onTaux, tauxParDefaut, montantViande }: Props) {
  const frais = parseDecimal(valeur);
  return (
    <View style={commonStyles.gap6}>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={T.fraisAbattoir}
            aide={T.fraisAbattoirAide}
            value={valeur}
            editable={false}
            style={commonStyles.verrouille}
            placeholder="0,00"
          />
        </View>
        {frais > 0 ? (
          <View style={commonStyles.flex1}>
            <SelectField label={T.tvaDesFrais} value={taux || tauxParDefaut} onChange={onTaux} options={OPTIONS_TAUX_TVA} />
          </View>
        ) : null}
      </View>
      {frais > 0 ? <Text style={commonStyles.note}>{T.totalAvecFrais(formatMontant(montantViande + frais))}</Text> : null}
    </View>
  );
}
