import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import type { LotFromage } from '@/features/stock/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.lots.modifierDate;

interface Props {
  visible: boolean;
  /** Le lot dont on modifie la date de fabrication. */
  lot?: LotFromage;
  /** Combien de lots la date change (ceux de la même fabrication, lui compris). */
  nombreDeLots: number;
  onValider: (date: string) => void;
  onFermer: () => void;
}

/**
 * La date de fabrication d'un lot : elle change pour tous les lots de sa fabrication, et le mouvement de stock du lait de cette
 * fabrication la suit.
 */
export function DateFabricationModal({ visible, lot, nombreDeLots, onValider, onFermer }: Props) {
  const [date, setDate] = useState('');
  useEffect(() => {
    // Chaque ouverture repart de la date du lot.
    if (visible && lot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(lot.dateFabrication);
    }
  }, [visible, lot]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titre(lot?.numero ?? '')}</Text>
          <DateField label={T.date} required value={date} onChange={setDate} />
          <Text style={commonStyles.note}>{T.note(nombreDeLots)}</Text>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.commun.general.enregistrer}
              onPress={() => onValider(date)}
              disabled={!date}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
