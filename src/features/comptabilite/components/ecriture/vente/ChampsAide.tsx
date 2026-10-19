import { Text, View } from 'react-native';
import { ChampTauxImposition } from '@/features/comptabilite/components/ChampTauxImposition';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { TypeAide } from '@/features/comptabilite/types';
import { TYPE_AIDE } from '@/shared/constants/comptabilite';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_AIDE } from '@/shared/textes/libelles';
import { type Props } from '@/features/comptabilite/components/ecriture/vente/outilsVente';

const OPTIONS_TYPE_AIDE = Object.entries(LABEL_TYPE_AIDE).map(([value, label]) => ({
  value: value as TypeAide,
  label,
}));

/** Type d'aide (DPB, écorégime, ICHN…) : remplace le numéro de facture pour une aide / subvention. */
export function ChampTypeAide({ e }: Props) {
  return (
    <>
      <SelectField
        label={TEXTES.comptabilite.nouvelleEcriture.typeDAide}
        required
        value={e.typeAide}
        onChange={e.changerTypeAide}
        options={OPTIONS_TYPE_AIDE}
      />
      {e.typeAide === TYPE_AIDE.AUTRE && (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.preciserLeTypeDAide}
          value={e.typeAideLibre}
          onChangeText={e.setTypeAideLibre}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.exAideGnrGuerreUkrainePoints}
        />
      )}
    </>
  );
}

/** Montant et taux d'imposition d'une aide / subvention (son type se choisit en haut du formulaire). */
export function ChampsAide({ e }: Props) {
  return (
    <>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxImposition value={e.tauxImpositionLibre} onChange={e.setTauxImpositionLibre} />
        </View>
      </View>
      <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.partDuMontantIncluseDans}</Text>
    </>
  );
}
