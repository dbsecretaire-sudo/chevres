import { Pressable, Text, View } from 'react-native';
import { SelectField } from '@/shared/components/SelectField';
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
  /** Une vente : le lien vers les taux de TVA de chaque produit. */
  parProduit?: () => void;
}

/** Le taux de TVA dans une liste déroulante (dépenses comme ventes), avec le HT et la TVA calculés à partir du montant TTC saisi. */
export function ChampTauxTva({ value, onChange, ttc = 0, parProduit }: Props) {
  const tva = tvaDuTtc(ttc, Number(value));
  return (
    <View style={commonStyles.gap10}>
      <SelectField<string> label={TEXTES.commun.general.tauxDeTva} value={value} onChange={onChange} options={OPTIONS_TAUX_TVA} />
      {parProduit ? (
        <Pressable onPress={parProduit} accessibilityRole="link">
          <Text style={commonStyles.lien}>{TEXTES.comptabilite.nouvelleEcriture.tvaParProduit}</Text>
        </Pressable>
      ) : null}
      {ttc > 0 ? (
        <Text style={commonStyles.note}>{`HT : ${formatMontant(ttc - tva)} · TVA : ${formatMontant(tva)}`}</Text>
      ) : null}
    </View>
  );
}
