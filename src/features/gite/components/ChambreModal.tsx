import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { COTE_CHAMBRE } from '@/shared/constants/gite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Cote = ValeurDe<typeof COTE_CHAMBRE>;

interface Props {
  visible: boolean;
  /** Le numéro que la nouvelle chambre recevra. */
  prochainNumero: number;
  onValider: (cote: Cote) => void;
  onFermer: () => void;
}

const T = TEXTES.gite.chambre;
const PUCES: { valeur: Cote; label: string }[] = [
  { valeur: COTE_CHAMBRE.GAUCHE, label: T.gauche },
  { valeur: COTE_CHAMBRE.DROITE, label: T.droite },
];

/** Petite fenêtre pour ajouter une chambre : on choisit le côté du couloir où elle se trouve. */
export function ChambreModal({ visible, prochainNumero, onValider, onFermer }: Props) {
  const [cote, setCote] = useState<Cote>(COTE_CHAMBRE.GAUCHE);

  useEffect(() => {
    // Chaque ouverture repart du côté gauche.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setCote(COTE_CHAMBRE.GAUCHE);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.ajouter(prochainNumero)}</Text>
          <Text style={commonStyles.lineSemiBold}>{T.cote}</Text>
          <PucesDefilantes<Cote> puces={PUCES} valeur={cote} onChoisir={setCote} />
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
              onPress={() => onValider(cote)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
