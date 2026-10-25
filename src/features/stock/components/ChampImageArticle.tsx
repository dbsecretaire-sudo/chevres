import { Image, StyleSheet, Text, View } from 'react-native';
import { piecesDisponibles, uriAffichagePiece } from '@/features/fichiers/services/pieces';
import { useImageDeLArticle } from '@/features/stock/hooks/useImageDeLArticle';
import { choisirUneImage, type ChoixImage } from '@/features/stock/services/imagesArticles';
import { Button } from '@/shared/components/Button';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.articleModal.image;

/**
 * L'image d'une carte du stock dans la fenêtre de modification : l'image actuelle (ou le dessin d'origine), un bouton pour en choisir une dans l'appareil et
 * un autre pour revenir au dessin d'origine. Le choix n'est enregistré que par le bouton de la fenêtre.
 */
export function ChampImageArticle({
  cle,
  emoji,
  choix,
  onChoix,
}: {
  cle: string;
  emoji: string;
  choix: ChoixImage | null;
  onChoix: (choix: ChoixImage | null) => void;
}) {
  const actuelle = useImageDeLArticle(cle);
  if (!piecesDisponibles()) return <Text style={commonStyles.note}>{T.indisponible}</Text>;
  const retiree = !!choix && 'retirer' in choix;
  const uri =
    choix && 'fichier' in choix ? choix.fichier.uri : actuelle && !retiree ? uriAffichagePiece(actuelle) : undefined;
  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineBold}>{T.titre}</Text>
      <View style={styles.ligne}>
        {uri ? (
          <Image source={{ uri }} style={styles.apercu} resizeMode="cover" />
        ) : (
          <Text style={styles.emoji}>{emoji}</Text>
        )}
        <View style={styles.boutons}>
          <Button
            variant="secondary"
            label={uri ? T.changer : T.choisir}
            onPress={async () => {
              const fichier = await choisirUneImage();
              if (fichier) onChoix({ fichier });
            }}
          />
          {uri ? (
            <Button
              variant="secondary"
              label={T.retirer}
              // Une image déjà enregistrée se retire à l'enregistrement ; une image juste choisie s'oublie.
              onPress={() => onChoix(actuelle ? { retirer: true } : null)}
            />
          ) : null}
        </View>
      </View>
      <Text style={commonStyles.note}>{T.aide}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  apercu: { width: 64, height: 64, borderRadius: 10 },
  emoji: { fontSize: 52, width: 64, textAlign: 'center' },
  boutons: { flex: 1, gap: 6 },
});
