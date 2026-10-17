import { useState } from 'react';
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
  /** Les frais, tels qu'ils s'écrivent (avec virgule) : le champ les garde tels quels pendant la frappe. */
  valeur: string;
  onChange: (texte: string) => void;
  /** Le taux de TVA des frais (vide : celui de la vente). */
  taux: string;
  onTaux: (taux: string) => void;
  tauxParDefaut: string;
  /** Le prix de la viande, sans les frais : le total de la facture s'affiche dessous. */
  montantViande: number;
}

/**
 * Les frais d'abattoir refacturés au client d'une vente de viande : le montant (proposé d'après le lot d'abattoir) et son taux de TVA.
 * L'appelant change la `key` quand le montant est proposé de l'extérieur (un autre lot, d'autres animaux) pour que le champ le reprenne.
 */
export function ChampFraisAbattoir({ valeur, onChange, taux, onTaux, tauxParDefaut, montantViande }: Props) {
  const [texte, setTexte] = useState(valeur);
  const frais = parseDecimal(texte);
  return (
    <View style={commonStyles.gap6}>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={T.fraisAbattoir}
            aide={T.fraisAbattoirAide}
            value={texte}
            onChangeText={(t) => {
              setTexte(t);
              onChange(t);
            }}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
        </View>
        {frais > 0 ? (
          <View style={commonStyles.flex1}>
            <SelectField
              label={T.tvaDesFrais}
              value={taux || tauxParDefaut}
              onChange={onTaux}
              options={OPTIONS_TAUX_TVA}
            />
          </View>
        ) : null}
      </View>
      {frais > 0 ? <Text style={commonStyles.note}>{T.totalAvecFrais(formatMontant(montantViande + frais))}</Text> : null}
    </View>
  );
}
