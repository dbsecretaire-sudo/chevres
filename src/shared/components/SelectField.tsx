import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SelectModal, type SelectOption } from '@/shared/components/SelectModal';
import { styles } from '@/shared/styles/components/SelectField.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { useFondChamp } from '@/shared/theme/FondChampContext';
import { TEXTES } from '@/shared/textes';

export type { SelectOption } from '@/shared/components/SelectModal';

interface Props<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  required?: boolean;
  /** Affiche un champ de recherche (filtre sur la valeur et le libellé) — utile pour les longues listes. */
  searchable?: boolean;
  /** Texte affiché quand aucune option ne correspond à value (ex: rien de sélectionné). */
  placeholder?: string;
  /** Masque le libellé au-dessus du champ (il reste le titre de la liste) — quand il est affiché ailleurs. */
  libelleCache?: boolean;
  /** Fait du libellé un lien (bleu, souligné) qui mène à ce qui gère la liste. */
  onPressLabel?: () => void;
  /** Une note sous le champ : ce qu'on y choisit et pourquoi. */
  aide?: string;
  /** Les groupes des options qui se choisissent par des puces (voir SelectModal). */
  puces?: string[];
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  required,
  searchable,
  placeholder,
  libelleCache,
  onPressLabel,
  aide,
  puces,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const fond = useFondChamp();

  return (
    <View style={commonStyles.gap6}>
      {libelleCache ? null : (
        <Text style={commonStyles.lineSemiBold}>
          {onPressLabel ? (
            <Text style={commonStyles.lien} onPress={onPressLabel} accessibilityRole="link">
              {label}
            </Text>
          ) : (
            label
          )}
          {required ? <Text style={commonStyles.required}> *</Text> : null}
        </Text>
      )}
      <Pressable style={[commonStyles.inputBox, { backgroundColor: fond }]} onPress={() => setOpen(true)}>
        <Text style={current ? commonStyles.valueText : styles.placeholder}>
          {current
            ? (current.shortLabel ?? current.label)
            : (placeholder ?? TEXTES.commun.selectField.selectionnerPoints)}
        </Text>
      </Pressable>
      {aide ? <Text style={commonStyles.note}>{aide}</Text> : null}

      <SelectModal
        visible={open}
        titre={label}
        value={value}
        options={options}
        searchable={searchable}
        puces={puces}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
