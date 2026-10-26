import { Text, View } from 'react-native';
import { ChoixPastilles } from '@/shared/components/ChoixPastilles';
import { OPTIONS_TAUX_TVA, tvaDuTtc } from '@/features/comptabilite/utils/tva';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatMontant } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** Le taux de TVA en texte (« 5.5 »). */
  value: string;
  onChange: (taux: string) => void;
  /** Le montant TTC saisi : le HT et la TVA s'en déduisent et s'affichent sous les taux. Le montant reste enregistré en TTC. */
  ttc?: number;
}

/** Le taux de TVA en pastilles, comme sur la maquette, avec le HT et la TVA calculés à partir du montant TTC saisi. */
export function ChampTauxTva({ value, onChange, ttc = 0 }: Props) {
  const tva = tvaDuTtc(ttc, Number(value));
  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.lineBold}>{TEXTES.commun.general.tauxDeTva}</Text>
      <ChoixPastilles options={OPTIONS_TAUX_TVA} value={value} onChange={onChange} />
      {ttc > 0 ? (
        <Text style={commonStyles.note}>{`HT : ${formatMontant(ttc - tva)} · TVA : ${formatMontant(tva)}`}</Text>
      ) : null}
    </View>
  );
}
