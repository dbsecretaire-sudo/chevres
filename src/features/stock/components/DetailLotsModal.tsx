import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FiltresLots, TableauLots } from '@/features/stock/components/TableauLots';
import { useListeLots } from '@/features/stock/hooks/useListeLots';
import { estArticleFromage } from '@/features/stock/services/lots';
import type { LotFromage } from '@/features/stock/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.lots;

interface Props {
  visible: boolean;
  /** Le fromage dont on montre les lots (il reste en place pendant que la fenêtre se ferme). */
  article: { cle: string; libelle: string } | null;
  lots: LotFromage[];
  /** Les fromages en stock qui n'ont pas de numéro de lot (saisis avant le suivi par lot). */
  sansLot: number;
  /** Relit les lots après un changement (la case de contrôle). */
  onChange: () => void;
  onFermer: () => void;
}

/**
 * Le détail d'un fromage dans l'inventaire : ses lots, sans bouton d'ajout ni de retrait (ils entrent par une fabrication et
 * sortent par une vente ou un rappel), seulement la case du contrôle.
 */
export function DetailLotsModal({ visible, article, lots, sansLot, onChange, onFermer }: Props) {
  const liste = useListeLots(lots, article?.cle);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>
            {estArticleFromage(article?.cle)
              ? T.titreFromage(article?.libelle ?? '')
              : T.titre(article?.libelle ?? '')}
          </Text>
          {article ? (
            <View style={commonStyles.gap10}>
              <FiltresLots liste={liste} />
              <TableauLots liste={liste} onChange={onChange} />
              {sansLot > 0 ? <Text style={commonStyles.mutedItalic}>{T.sansLot(sansLot)}</Text> : null}
            </View>
          ) : null}
          <Text style={[commonStyles.note, commonStyles.required]}>{T.rappel}</Text>
          <Button label={T.ok} onPress={onFermer} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
