import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisionneuseImage } from '@/features/fichiers/components/VisionneuseImage';
import { ouvrirPiece, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import { EXTENSIONS_IMAGE } from '@/shared/constants/fichiers';
import type { PieceJointe } from '@/features/fichiers/types';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/fichiers/Visionneuse.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * L'aperçu d'un fichier joint : une image se voit telle quelle, et un appui l'ouvre en plein écran avec un zoom ; un PDF, un Word ou
 * un Excel (dont l'application ne sait pas dessiner la page) montrent un cadre avec son type, et un appui ouvre le fichier.
 * Sur le web, l'image vient du serveur (`uri`) et l'appui ouvre le fichier (`ouvrir`) au lieu du zoom.
 */
export function ApercuPiece({ piece, uri, ouvrir }: { piece: PieceJointe; uri?: string; ouvrir?: () => void }) {
  const extension = piece.extension.toLowerCase();
  const [pleinEcran, setPleinEcran] = useState(false);
  if (!EXTENSIONS_IMAGE.includes(extension))
    return (
      <Pressable onPress={ouvrir ?? (() => ouvrirPiece(piece))} accessibilityLabel={piece.nom}>
        <View style={commonStyles.apercuDocument}>
          <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
          <Text style={commonStyles.muted}>{extension.toUpperCase()}</Text>
        </View>
      </Pressable>
    );
  return (
    <>
      <Pressable
        onPress={ouvrir ?? (() => setPleinEcran(true))}
        accessibilityLabel={TEXTES.fichiers.visionneuse.agrandir}
      >
        <Image
          source={{ uri: uri ?? uriAffichagePiece(piece) }}
          style={commonStyles.apercuImage}
          resizeMode="contain"
        />
        <View style={styles.coin}>
          <Ionicons name="expand-outline" size={18} color={colors.blanc} />
        </View>
      </Pressable>
      {ouvrir ? null : <VisionneuseImage piece={piece} visible={pleinEcran} onFermer={() => setPleinEcran(false)} />}
    </>
  );
}
