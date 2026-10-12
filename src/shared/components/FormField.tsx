import { Text, TextInput, View, type TextInputProps } from 'react-native';
import type { Explication } from '@/shared/components/ExplicationModal';
import { LibelleChamp } from '@/shared/components/LibelleChamp';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { useFondChamp } from '@/shared/theme/FondChampContext';

interface Props extends TextInputProps {
  /** Facultatif : quand absent, aucun libellé n'est affiché au-dessus du champ (utile pour un champ auto-porté par son placeholder). */
  label?: string;
  required?: boolean;
  /** Une note sous le champ : ce qu'on y met, dans quel format, pourquoi. */
  aide?: string;
  /** Une explication longue : un « ? » à côté du nom du champ l'ouvre dans une fenêtre (plutôt qu'un long texte sous le champ). */
  explication?: Explication;
  /** Ce qui ne va pas, en rouge sous le champ (le contour devient rouge aussi). */
  erreur?: string;
}

export function FormField({ label, required, aide, explication, erreur, style, ...rest }: Props) {
  const fond = useFondChamp();
  return (
    <View style={commonStyles.gap6}>
      {label ? <LibelleChamp label={label} required={required} explication={explication} /> : null}
      <TextInput
        style={[
          commonStyles.input,
          { backgroundColor: fond },
          erreur ? { borderColor: colors.danger } : null,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
      {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
      {aide && !erreur ? <Text style={commonStyles.note}>{aide}</Text> : null}
    </View>
  );
}
