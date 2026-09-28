import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/theme/colors';
import { useAccentColor } from '@/theme/AccentColorContext';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  required?: boolean;
  /** Affiche un champ de recherche (filtre sur la valeur et le libellé) — utile pour les longues listes. */
  searchable?: boolean;
}

export function SelectField<T extends string>({ label, value, options, onChange, required, searchable }: Props<T>) {
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
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{current?.label ?? 'Sélectionner…'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={fermer}>
        <Pressable style={styles.backdrop} onPress={fermer}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable && (
              <TextInput
                style={styles.recherche}
                placeholder="Rechercher par n° ou libellé…"
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
                  <Text style={[styles.optionText, item.value === value && { color: accent, fontWeight: '700' }]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.aucunResultat}>Aucun résultat.</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  required: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  value: { fontSize: 16, color: colors.text },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: colors.text },
  recherche: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  liste: { flexShrink: 1 },
  option: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  optionSelected: { backgroundColor: colors.badgeBg },
  optionText: { fontSize: 16, color: colors.text },
  aucunResultat: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic', paddingVertical: 12, textAlign: 'center' },
});
