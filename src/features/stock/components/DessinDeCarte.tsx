import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { piecesDisponibles, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import { lirePieceDistante } from '@/features/fichiers/services/piecesWeb';
import { useImageDeLArticle } from '@/features/stock/hooks/useImageDeLArticle';
import { afficheSobre } from '@/shared/utils/affichage';

const TAILLE = 52;

/** Le dessin d'une carte : l'image choisie par l'utilisateur pour l'article, sinon le dessin d'origine (ou si l'image reste introuvable). */
export function DessinDeCarte({ emoji, cle }: { emoji: string; cle?: string }) {
  const image = useImageDeLArticle(cle);
  const [perdue, setPerdue] = useState<string | null>(null);
  // Sur la PWA (et hors du poste Windows), l'image se lit sur le serveur : elle n'est pas sur l'appareil.
  const [distante, setDistante] = useState<string | undefined>();
  useEffect(() => {
    if (!image || piecesDisponibles()) return;
    let actif = true;
    lirePieceDistante(image)
      .then((donnees) => {
        if (actif) setDistante(donnees);
      })
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, [image]);
  // L'affichage sobre n'a ni dessin ni image (les images choisies sont celles des versions complètes, mobile et PC).
  if (afficheSobre()) return null;
  const uri = image ? (piecesDisponibles() ? uriAffichagePiece(image) : distante) : undefined;
  if (image && uri && perdue !== image.id) {
    return (
      <Image
        source={{ uri }}
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
