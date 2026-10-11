import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ouvrirPiece, uriPiece } from '@/features/fichiers/services/pieces';
import { EXTENSIONS_IMAGE } from '@/shared/constants/fichiers';
import type { PieceJointe } from '@/features/fichiers/types';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/**
 * L'aperçu d'un fichier joint : une image se voit telle quelle ; un PDF, un Word ou un Excel (dont l'application ne sait pas
 * dessiner la page) montrent un cadre avec son type. Un appui ouvre le fichier.
 */
export function ApercuPiece({ piece }: { piece: PieceJointe }) {
  const extension = piece.extension.toLowerCase();
  return (
    <Pressable onPress={() => ouvrirPiece(piece)} accessibilityLabel={piece.nom}>
      {EXTENSIONS_IMAGE.includes(extension) ? (
        <Image source={{ uri: uriPiece(piece) }} style={commonStyles.apercuImage} resizeMode="contain" />
      ) : (
        <View style={commonStyles.apercuDocument}>
          <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
          <Text style={commonStyles.muted}>{extension.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}
