import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { piecesDisponibles, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import { lirePieceDistante } from '@/features/fichiers/services/piecesWeb';
import { EXTENSIONS_IMAGE } from '@/shared/constants/fichiers';
import type { PieceJointe } from '@/features/fichiers/types';
import { colors } from '@/shared/theme/colors';

/** La taille d'une vignette, en points. */
const TAILLE = 52;

/**
 * La miniature d'un document joint : une image se voit en petit, un autre document (un PDF, par exemple) montre une vignette à son type. Un appui
 * ouvre ce document-là, et seulement celui-là. Sur le web, l'image vient du serveur.
 */
export function VignetteDocument({ piece, ouvrir }: { piece: PieceJointe; ouvrir: () => void }) {
  const extension = piece.extension.toLowerCase();
  const image = EXTENSIONS_IMAGE.includes(extension);
  const [uri, setUri] = useState<string | undefined>(image && piecesDisponibles() ? uriAffichagePiece(piece) : undefined);

  useEffect(() => {
    if (!image || piecesDisponibles()) return;
    let actif = true;
    lirePieceDistante(piece)
      .then((donnees) => {
        if (actif) setUri(donnees);
      })
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, [piece, image]);

  return (
    <Pressable
      onPress={ouvrir}
      accessibilityRole="button"
      accessibilityLabel={piece.nom}
      style={{ width: TAILLE, height: TAILLE, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
    >
      {image && uri ? (
        <Image source={{ uri }} style={{ width: TAILLE, height: TAILLE }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.badgeBg, gap: 2 }}>
          <Ionicons name={image ? 'image-outline' : 'document-text-outline'} size={20} color={colors.primary} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>{extension.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}
