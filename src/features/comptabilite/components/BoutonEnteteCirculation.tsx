import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Le bouton de l'en-tête qui mène aux documents de circulation : son nom court, et le logo d'un document (blanc sur le vert de l'en-tête). */
export function BoutonEnteteCirculation({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={[commonStyles.boutonEnteteDroite, commonStyles.row, { alignItems: 'center' }]}
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.cheptel.circulation.boutonEntete}
    >
      <Text style={[commonStyles.texteEntete, { textAlignVertical: 'center' }]}>{TEXTES.cheptel.circulation.boutonEntete}</Text>
      <View
        style={{
          borderWidth: 1.5,
          borderColor: colors.blanc,
          borderRadius: 6,
          padding: 3,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="document-text" size={20} color={colors.blanc} />
      </View>
    </Pressable>
  );
}
