import { useMemo, useState } from 'react';
import { comparerAlphabetique } from '@/shared/utils/personne';
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
  /** La puce choisie à chaque ouverture (celle du groupe de la valeur déjà choisie, à défaut celle-ci) ; sans elle, toutes les lignes. */
  puceParDefaut?: string;
  /** Le texte du champ de recherche quand il diffère du texte d'office. */
  placeholderRecherche?: string;
  /** Quand il est donné, ce qu'on tape dans la recherche, s'il n'est pas dans la liste, se propose comme valeur (« Utiliser le n° 123 »). */
  libelleSaisieLibre?: (texte: string) => string;
  /**
   * Les groupes des options (leur `groupe`) se choisissent d'abord, en liste : un appui sur un groupe montre ses options, et « Catégories » revient
   * à la liste des groupes. Une recherche tapée cherche dans tous les groupes. Un seul groupe : on passe directement à ses options.
   */
  parCategories?: boolean;
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
  puceParDefaut,
  placeholderRecherche,
  libelleSaisieLibre,
  parCategories = false,
}: Props<T>) {
  const accent = useAccentColor();
  const [recherche, setRecherche] = useState('');
  /** La puce choisie (aucune : tous les groupes). */
  const [groupeChoisi, setGroupeChoisi] = useState<string | null>(null);
  // À chaque ouverture, la puce par défaut (ou celle de la valeur déjà choisie, pour la retrouver dans la liste).
  const [dejaOuverte, setDejaOuverte] = useState(false);
  if (visible !== dejaOuverte) {
    setDejaOuverte(visible);
    if (visible && puceParDefaut) {
      setGroupeChoisi(options.find((o) => o.value === value)?.groupe ?? puceParDefaut);
    }
    // Par catégories : on rouvre sur celle de la valeur déjà choisie, sinon sur la liste des catégories.
    if (visible && parCategories)
      setGroupeChoisi((value && options.find((o) => o.value === value)?.groupe) || null);
  }
  const groupes = puces ?? [];
  const avecPuces = groupes.length > 0;
  /** Les catégories (groupes) des options, dans l'ordre de la liste. */
  const categories = useMemo(
    () =>
      parCategories
        ? [...new Set(options.flatMap((o) => (o.groupe ? [o.groupe] : [])))].sort(comparerAlphabetique)
        : [],
    [options, parCategories],
  );
  /** Les options sans catégorie (« Aucun »…) : elles restent proposées à côté des catégories. */
  const sansCategorie = parCategories ? options.filter((o) => !o.groupe) : [];
  /** La recherche tapée sur la liste des catégories : seules restent celles qui ont un contact correspondant, avec les noms trouvés. */
  const correspond = (o: SelectOption<T>) => {
    const q = recherche.trim().toLowerCase();
    return !q || o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q);
  };
  const lignesDesCategories: {
    nom: string;
    categorie: boolean;
    option?: SelectOption<T>;
    trouves: SelectOption<T>[];
  }[] = [
    ...categories
      .map((nom) => ({
        nom,
        categorie: true,
        trouves: options.filter((o) => o.groupe === nom && correspond(o)),
      }))
      .filter((c) => c.trouves.length > 0),
    ...sansCategorie
      .filter(correspond)
      .map((o) => ({ nom: o.label, categorie: false, option: o, trouves: [] as SelectOption<T>[] })),
  ];
  /** Un seul groupe : directement ses options, sans liste de catégories. */
  const categorieActive = parCategories
    ? (groupeChoisi ?? (categories.length === 1 ? categories[0] : null))
    : null;
  const enListeDeCategories = parCategories && categories.length > 1 && !groupeChoisi;

  const optionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const duGroupe =
      (groupeChoisi ?? categorieActive)
        ? options.filter((o) => o.groupe === (groupeChoisi ?? categorieActive))
        : options;
    if (!q) return duGroupe;
    return duGroupe.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, recherche, groupeChoisi, categorieActive]);

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
          {options.some((o) => o.groupe) && !avecPuces && !parCategories ? null : (
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
          {/* Une catégorie ouverte : le retour à la liste des catégories, et son nom. */}
          {parCategories && categories.length > 1 && groupeChoisi ? (
            <Pressable style={styles.option} onPress={() => setGroupeChoisi(null)} accessibilityRole="button">
              <Text style={[commonStyles.valueText, { color: accent, fontWeight: '700' }]}>
                {'‹ '}
                {TEXTES.commun.selectField.categories} · {groupeChoisi}
              </Text>
            </Pressable>
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
          {/* La liste des catégories : un appui en montre les options. */}
          {enListeDeCategories ? (
            <FlatList
              style={styles.liste}
              data={lignesDesCategories}
              keyExtractor={(item, index) => `${item.nom}|${index}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    if (item.categorie) setGroupeChoisi(item.nom);
                    else if (item.option) {
                      onSelect(item.option.value);
                      fermer();
                    }
                  }}
                >
                  <Text style={commonStyles.valueText}>
                    {item.nom}
                    {item.categorie ? ` (${item.trouves.length})` : ''}
                  </Text>
                  {/* Une recherche : les contacts trouvés dans cette catégorie. */}
                  {item.categorie && recherche.trim() ? (
                    <Text style={commonStyles.note} numberOfLines={2}>
                      {item.trouves
                        .slice(0, 4)
                        .map((o) => o.label)
                        .join(' · ')}
                      {item.trouves.length > 4 ? ' …' : ''}
                    </Text>
                  ) : null}
                </Pressable>
              )}
            />
          ) : (
            <FlatList
              style={styles.liste}
              data={optionsFiltrees}
              keyExtractor={(item, index) => `${item.value}|${index}`}
              renderItem={({ item, index }) => (
                <>
                  {!avecPuces &&
                  !parCategories &&
                  item.groupe &&
                  item.groupe !== optionsFiltrees[index - 1]?.groupe ? (
                    <Text style={[commonStyles.lineBold, styles.groupe]}>{item.groupe}</Text>
                  ) : null}
                  <Pressable
                    style={[
                      styles.option,
                      item.groupe && !avecPuces && !parCategories && styles.optionGroupee,
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
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
