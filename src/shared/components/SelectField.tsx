import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { styles } from '@/shared/styles/components/SelectField.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Libellé affiché une fois sélectionné, dans le champ fermé — si absent, retombe sur `label` (utilisé dans la liste déroulante, lui, toujours affiché en entier). */
  shortLabel?: string;
}

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
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  required,
  searchable,
  placeholder,
}: Props<T>) {
  const accent = useAccentColor();
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState('');
  const current = options.find((o) => o.value === value);

  const optionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, recherche]);

  const fermer = () => {
    setOpen(false);
    setRecherche('');
  };

  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineSemiBold}>
        {label}
        {required ? <Text style={commonStyles.required}> *</Text> : null}
      </Text>
      <Pressable style={commonStyles.inputBox} onPress={() => setOpen(true)}>
        <Text style={current ? commonStyles.valueText : styles.placeholder}>
          {current
            ? (current.shortLabel ?? current.label)
            : (placeholder ?? TEXTES.commun.selectField.selectionnerPoints)}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={fermer}>
        <Pressable style={commonStyles.backdrop} onPress={fermer}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable && (
              <TextInput
                style={styles.recherche}
                placeholder={TEXTES.commun.selectField.rechercherParNOuLibellePoints}
                placeholderTextColor={colors.textMuted}
                value={recherche}
                onChangeText={setRecherche}
              />
            )}
            <FlatList
              style={styles.liste}
              data={optionsFiltrees}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item.value);
                    fermer();
                  }}
                >
                  <Text
                    style={[
                      commonStyles.valueText,
                      item.value === value && { color: accent, fontWeight: '700' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.aucunResultat}>{TEXTES.commun.selectField.aucunResultat}</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
