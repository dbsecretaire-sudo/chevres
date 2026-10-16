import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FiltresBoucles, TableauBoucles } from '@/features/stock/components/TableauBoucles';
import { useListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import type { BoucleStock, MouvementStock } from '@/features/stock/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles;

interface Props {
  visible: boolean;
  /** L'article dont on montre les boucles (il reste en place pendant que la fenêtre se ferme). */
  article: { cle: string; libelle: string } | null;
  boucles: BoucleStock[];
  /** Les mouvements de l'inventaire : les boucles de remplacement (rouges, rebouclage) en tirent leurs lignes en stock et leurs dates d'achat. */
  mouvements: MouvementStock[];
  onFermer: () => void;
}

/**
 * Le détail d'une sorte de boucles dans l'inventaire : ses numéros, sans bouton d'ajout ni de retrait (les boucles entrent par
 * un achat en comptabilité et sortent par une pose au cheptel), ni suppression de l'article.
 */
export function DetailBouclesModal({ visible, article, boucles, mouvements, onFermer }: Props) {
  const liste = useListeBoucles(boucles, article?.cle, mouvements);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titre(article?.libelle ?? '')}</Text>
          {article ? (
            <View style={commonStyles.gap10}>
              <FiltresBoucles liste={liste} />
              <TableauBoucles liste={liste} />
            </View>
          ) : null}
          <Text style={[commonStyles.note, commonStyles.required]}>{T.rappel}</Text>
          <Button label={T.ok} onPress={onFermer} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
