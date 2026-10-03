import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectField } from '@/shared/components/SelectField';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

type SelectFieldProps<T extends string> = ComponentProps<typeof SelectField<T>>;

interface Props<T extends string> extends SelectFieldProps<T> {
  /** Ouvre l'écran de gestion de la liste (ex : fiches fournisseurs). */
  onEdit: () => void;
}

/** Liste déroulante suivie d'un bouton crayon menant à l'écran qui gère ses valeurs. */
export function SelectFieldEditable<T extends string>({ onEdit, ...selectProps }: Props<T>) {
  return (
    <View style={commonStyles.rowFin}>
      <View style={commonStyles.flex1}>
        <SelectField {...selectProps} />
      </View>
      <Pressable style={commonStyles.boutonIcone} onPress={onEdit}>
        <Ionicons name="pencil" size={20} color={colors.ajout} />
      </Pressable>
    </View>
  );
}
