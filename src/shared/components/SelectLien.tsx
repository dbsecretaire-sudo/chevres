import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectModal, type SelectOption } from '@/shared/components/SelectModal';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { styles } from '@/shared/styles/components/SelectField.styles';

interface Props<T extends string> {
  /** Titre de la fenêtre de choix. */
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

/** Choix dans une liste présenté comme un texte souligné suivi d'un crayon ; un appui ouvre la liste. */
export function SelectLien<T extends string>({ label, value, options, onChange }: Props<T>) {
  const accent = useAccentColor();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable style={styles.lien} onPress={() => setOpen(true)}>
        <Text style={[styles.lienTexte, { color: accent }]}>
          {current?.shortLabel ?? current?.label ?? ''}
        </Text>
        <Ionicons name="pencil" size={18} color={accent} />
      </Pressable>
      <SelectModal
        visible={open}
        titre={label}
        value={value}
        options={options}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
