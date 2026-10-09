import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/ChampRecherche.styles';
import { TEXTES } from '@/shared/textes';

type Props = Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder'>;

/**
 * Le champ de recherche des listes : une seule ligne basse sur toute la largeur, une loupe à gauche et une croix pour l'effacer.
 * Sans libellé : sa loupe et son texte d'aide disent déjà à quoi il sert.
 */
export function ChampRecherche({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.champ}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={styles.saisie}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? TEXTES.commun.general.rechercher}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        accessibilityLabel={TEXTES.commun.general.rechercher}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText?.('')}
          hitSlop={10}
          accessibilityLabel={TEXTES.commun.general.effacer}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
