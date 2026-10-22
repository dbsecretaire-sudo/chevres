import { useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { piecesDisponibles, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import { useImageDeLArticle } from '@/features/stock/hooks/useImageDeLArticle';
import { afficheSobre } from '@/shared/utils/affichage';

const TAILLE = 52;

/** Le dessin d'une carte : l'image choisie par l'utilisateur pour l'article, sinon le dessin d'origine (ou si l'image reste introuvable). */
export function DessinDeCarte({ emoji, cle }: { emoji: string; cle?: string }) {
  const image = useImageDeLArticle(cle);
  const [perdue, setPerdue] = useState<string | null>(null);
  // L'affichage sobre n'a pas de dessin.
  if (afficheSobre()) return null;
  if (image && piecesDisponibles() && perdue !== image.id) {
    return (
      <Image
        source={{ uri: uriAffichagePiece(image) }}
        style={styles.image}
        resizeMode="cover"
        onError={() => setPerdue(image.id)}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
  return (
    <Text style={styles.dessin} accessibilityElementsHidden importantForAccessibility="no">
      {emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  dessin: { fontSize: 46 },
  image: { width: TAILLE, height: TAILLE, borderRadius: 8 },
});
