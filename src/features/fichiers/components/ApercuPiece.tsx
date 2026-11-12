import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisionneuseImage } from '@/features/fichiers/components/VisionneuseImage';
import { ouvrirPiece, piecesDisponibles, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import { lirePieceDistante } from '@/features/fichiers/services/piecesWeb';
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
  const image = EXTENSIONS_IMAGE.includes(extension);
  const [pleinEcran, setPleinEcran] = useState(false);
  // Sur le web, l'image n'est pas rangée dans le navigateur : elle est lue depuis le serveur.
  const [distante, setDistante] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!image || uri || piecesDisponibles()) return;
    let actif = true;
    lirePieceDistante(piece)
      .then((donnees) => {
        if (actif) setDistante(donnees);
      })
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, [piece, image, uri]);
  if (!image)
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
        // Sur le web, l'appui ouvre le fichier (le zoom ne lit que les fichiers rangés dans l'appareil).
        onPress={ouvrir ?? (piecesDisponibles() ? () => setPleinEcran(true) : () => ouvrirPiece(piece))}
        accessibilityLabel={TEXTES.fichiers.visionneuse.agrandir}
      >
        <Image
          source={{ uri: uri ?? (piecesDisponibles() ? uriAffichagePiece(piece) : distante) }}
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
