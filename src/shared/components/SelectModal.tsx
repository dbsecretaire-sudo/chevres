import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput } from 'react-native';
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
  visible: boolean;
  titre: string;
  value: T;
  options: SelectOption<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
  /** Affiche un champ de recherche (filtre sur la valeur et le libellé) — utile pour les longues listes. */
  searchable?: boolean;
}

/** Fenêtre de choix dans une liste, partagée par SelectField (champ) et SelectLien (lien souligné). */
export function SelectModal<T extends string>({
  visible,
  titre,
  value,
  options,
  onSelect,
  onClose,
  searchable,
}: Props<T>) {
  const accent = useAccentColor();
  const [recherche, setRecherche] = useState('');

  const optionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, recherche]);

  const fermer = () => {
    setRecherche('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable style={commonStyles.backdrop} onPress={fermer}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>{titre}</Text>
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
                  onSelect(item.value);
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
  );
}
