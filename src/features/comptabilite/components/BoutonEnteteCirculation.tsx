import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Le bouton de l'en-tête qui génère le document de circulation (modèle pré-rempli) : son nom court, et une icône de document. */
export function BoutonEnteteCirculation({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={[commonStyles.boutonEnteteDroite, commonStyles.row]}
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.cheptel.circulation.bouton}
    >
      <Text style={commonStyles.texteEntete}>{TEXTES.cheptel.circulation.boutonEntete}</Text>
      <View style={{ backgroundColor: colors.blanc, borderRadius: 6, padding: 4 }}>
        <Ionicons name="document-text" size={20} color={colors.primary} />
      </View>
    </Pressable>
  );
}
