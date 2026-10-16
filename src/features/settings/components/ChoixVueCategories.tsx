import { View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  parOption: boolean;
  onChange: (parOption: boolean) => void;
  libelleParCategorie: string;
  libelleParOption: string;
}

/** Les deux vues des réglages des catégories : une catégorie et ses options, ou une option et ses catégories. */
export function ChoixVueCategories({ parOption, onChange, libelleParCategorie, libelleParOption }: Props) {
  return (
    <View style={commonStyles.row}>
      <Button
        style={commonStyles.flex1}
        variant={parOption ? 'secondary' : 'primary'}
        label={libelleParCategorie}
        onPress={() => onChange(false)}
      />
      <Button
        style={commonStyles.flex1}
        variant={parOption ? 'primary' : 'secondary'}
        label={libelleParOption}
        onPress={() => onChange(true)}
      />
    </View>
  );
}
