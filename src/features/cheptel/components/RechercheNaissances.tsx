import { Pressable, Text, View } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.naissances.recherche;

interface Props {
  valeur: string;
  onChange: (valeur: string) => void;
}

/** Le champ de recherche de la liste des naissances : il cherche l'acheteur, un n° de boucle, M ou F, ou une date. */
export function RechercheNaissances({ valeur, onChange }: Props) {
  return (
    <View style={commonStyles.gap10}>
      <FormField label={T.libelle} value={valeur} onChangeText={onChange} placeholder={T.exemple} />
      {valeur.trim() ? (
        <Pressable onPress={() => onChange('')} accessibilityRole="button">
          <Text style={commonStyles.lien}>{T.effacer}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
