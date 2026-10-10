import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { FiltresExclusifs } from '@/shared/components/FiltresExclusifs';
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
  /** Le titre du groupe de la ligne : il s'affiche au-dessus de la première ligne de chaque groupe (les lignes d'un groupe se suivent). */
  groupe?: string;
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
  /** Les groupes (leurs titres) qui se choisissent par des puces sous la recherche, l'une ou l'autre, au lieu d'être des titres dans la liste. */
  puces?: string[];
  /** Le texte du champ de recherche quand il diffère du texte d'office. */
  placeholderRecherche?: string;
  /** Quand il est donné, ce qu'on tape dans la recherche, s'il n'est pas dans la liste, se propose comme valeur (« Utiliser le n° 123 »). */
  libelleSaisieLibre?: (texte: string) => string;
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
  puces,
  placeholderRecherche,
  libelleSaisieLibre,
}: Props<T>) {
  const accent = useAccentColor();
  const [recherche, setRecherche] = useState('');
  /** La puce choisie (aucune : tous les groupes). */
  const [groupeChoisi, setGroupeChoisi] = useState<string | null>(null);
  const groupes = puces ?? [];
  const avecPuces = groupes.length > 0;

  const optionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const duGroupe = groupeChoisi ? options.filter((o) => o.groupe === groupeChoisi) : options;
    if (!q) return duGroupe;
    return duGroupe.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, recherche, groupeChoisi]);

  /** Ce qu'on tape n'est pas dans la liste : on le propose comme valeur (quand la saisie libre est permise). */
  const propositionLibre =
    !!libelleSaisieLibre && !!recherche.trim() && !options.some((o) => o.value === recherche.trim());

  const fermer = () => {
    setRecherche('');
    setGroupeChoisi(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable style={commonStyles.backdrop} onPress={fermer}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Une liste en groupes porte déjà ses titres : celui de la fenêtre ferait doublon. */}
          {options.some((o) => o.groupe) && !avecPuces ? null : (
            <Text style={styles.sheetTitle}>{titre}</Text>
          )}
          {searchable && (
            <TextInput
              style={styles.recherche}
              placeholder={placeholderRecherche ?? TEXTES.commun.selectField.rechercherParNOuLibellePoints}
              placeholderTextColor={colors.textMuted}
              value={recherche}
              onChangeText={setRecherche}
            />
          )}
          {groupes.length > 0 ? (
            <View style={styles.puces}>
              <FiltresExclusifs choix={groupes} valeur={groupeChoisi} onChoisir={setGroupeChoisi} />
            </View>
          ) : null}
          {propositionLibre ? (
            <Pressable
              style={styles.option}
              onPress={() => {
                onSelect(recherche.trim() as T);
                fermer();
              }}
            >
              <Text style={[commonStyles.valueText, { color: accent, fontWeight: '700' }]}>
                {libelleSaisieLibre?.(recherche.trim())}
              </Text>
            </Pressable>
          ) : null}
          <FlatList
            style={styles.liste}
            data={optionsFiltrees}
            keyExtractor={(item, index) => `${item.value}|${index}`}
            renderItem={({ item, index }) => (
              <>
                {!avecPuces && item.groupe && item.groupe !== optionsFiltrees[index - 1]?.groupe ? (
                  <Text style={[commonStyles.lineBold, styles.groupe]}>{item.groupe}</Text>
                ) : null}
                <Pressable
                  style={[
                    styles.option,
                    item.groupe && !avecPuces && styles.optionGroupee,
                    item.value === value && styles.optionSelected,
                  ]}
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
              </>
            )}
            ListEmptyComponent={
              propositionLibre ? null : (
                <Text style={styles.aucunResultat}>{TEXTES.commun.selectField.aucunResultat}</Text>
              )
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
