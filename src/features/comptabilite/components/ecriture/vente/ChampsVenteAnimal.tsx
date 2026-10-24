import { View } from 'react-native';
import { AvertissementDelais } from '@/features/sante/components/AvertissementDelais';
import { FormField } from '@/shared/components/FormField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { ChampTauxTvaVente, type Props } from '@/features/comptabilite/components/ecriture/vente/outilsVente';

/** Vente d'un animal sur pied ou vivant : nombre de têtes, poids (facultatif), prix, TVA et précision facultative. */
export function ChampsVenteAnimal({ e }: Props) {
  return (
    <>
      <AvertissementDelais type="viande" date={e.dateAbattoir || e.date} />
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeTetes}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.poidsKg}
            value={e.poidsKg}
            onChangeText={e.setPoidsKg}
            keyboardType="decimal-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}
