import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/SelectField.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  visible: boolean;
  titre: string;
  aide: string;
  fermer: string;
  aucune: string;
  /** Les catégories de tiers (fournisseurs et clients) qu'on peut cocher. */
  categories: readonly { id: string; nom: string }[];
  /** Les identifiants des catégories cochées. */
  cochees: readonly string[];
  /** Les catégories toujours incluses (elles n'ont pas de case à cocher). */
  imposees?: readonly string[];
  /** Le nombre de tiers de chaque catégorie (par identifiant). */
  nombreParCategorie: Record<string, number>;
  nombreDeTiers: (n: number) => string;
  onChange: (cochees: string[]) => void;
  onClose: () => void;
}

/**
 * Le choix des catégories de tiers d'une page (Partenariats…) : chaque catégorie se coche ou se décoche, et ses tiers rejoignent la page. Les
 * catégories d'office de la page restent incluses.
 */
export function ChoixCategoriesTiers({
  visible,
  titre,
  aide,
  fermer,
  aucune,
  categories,
  cochees,
  imposees = [],
  nombreParCategorie,
  nombreDeTiers,
  onChange,
  onClose,
}: Props) {
  const accent = useAccentColor();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>{titre}</Text>
          <Text style={commonStyles.note}>{aide}</Text>
          <FlatList
            style={styles.liste}
            data={categories.filter((c) => !imposees.includes(c.id))}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => {
              const coche = cochees.includes(item.id);
              return (
                <Pressable
                  style={[commonStyles.row, styles.option]}
                  onPress={() => onChange(coche ? cochees.filter((id) => id !== item.id) : [...cochees, item.id])}
                >
                  <Ionicons name={coche ? 'checkbox' : 'square-outline'} size={22} color={coche ? accent : colors.textMuted} />
                  <View style={commonStyles.textWrap}>
                    <Text style={[commonStyles.valueText, coche && { color: accent, fontWeight: '700' }]}>{item.nom}</Text>
                    <Text style={commonStyles.note}>{nombreDeTiers(nombreParCategorie[item.id] ?? 0)}</Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={styles.aucunResultat}>{aucune}</Text>}
          />
          <Button label={fermer} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
