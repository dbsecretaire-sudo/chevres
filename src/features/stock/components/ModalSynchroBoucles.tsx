import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import type { BouclePossible } from '@/features/stock/services/boucles';
import { styles } from '@/shared/styles/stock/ModalSynchroBoucles.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles.synchro;

interface Props {
  visible: boolean;
  /** Les numéros de boucle portés par les animaux, avec ceux que l'inventaire tient déjà pour des tiptag. */
  possibles: BouclePossible[];
  /** Les numéros cochés : les tiptag (les autres entrent dans les boucles). */
  onValider: (tiptags: string[]) => void;
  onAnnuler: () => void;
}

/**
 * La synchronisation de l'inventaire des boucles avec le cheptel : la liste des numéros que portent les animaux, où l'on coche les
 * tiptag. Les boucles non cochées sont intégrées dans les boucles ; les boucles déjà reprises du cheptel sont supprimées de
 * l'inventaire puis reprises selon ce choix.
 */
export function ModalSynchroBoucles({ visible, possibles, onValider, onAnnuler }: Props) {
  const [coches, setCoches] = useState<string[]>([]);

  useEffect(() => {
    // Chaque ouverture repart de ce que l'inventaire tient déjà pour des tiptag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setCoches(possibles.filter((p) => p.tiptag).map((p) => p.numero));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const basculer = (numero: string, cochee: boolean) =>
    setCoches((l) => (cochee ? [...l, numero] : l.filter((n) => n !== numero)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={commonStyles.backdrop} onPress={onAnnuler}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titreModal}</Text>
          <Text style={commonStyles.muted}>{T.consigne}</Text>
          <ScrollView style={styles.liste} contentContainerStyle={commonStyles.gap10}>
            {possibles.map((p) => (
              <Checkbox
                key={p.numero}
                label={p.numero}
                value={coches.includes(p.numero)}
                onChange={(cochee) => basculer(p.numero, cochee)}
              />
            ))}
          </ScrollView>
          <Text style={commonStyles.note}>{T.suppression}</Text>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onAnnuler}
            />
            <Button style={commonStyles.flex1} label={T.valider} onPress={() => onValider(coches)} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
