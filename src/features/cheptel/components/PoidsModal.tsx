import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { lirePoids } from '@/features/cheptel/utils/poids';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  /** L'animal dont on note le poids (affiché au-dessus du champ, quand plusieurs animaux se suivent). */
  titre?: string;
  /** Le poids déjà noté, en kilos (vide : aucun). */
  valeurInitiale?: number;
  /** Le poids saisi (rien quand le champ est vide ou illisible) ; la fenêtre se ferme ensuite. */
  onValider: (poidsKg: number | undefined) => void;
  onFermer: () => void;
}

/** Le poids d'un animal en kilos : un champ et « OK » (le poids s'écrit sur la fiche de l'animal). */
export function PoidsModal({ visible, titre, valeurInitiale, onValider, onFermer }: Props) {
  // La fenêtre se recrée à chaque ouverture : le champ repart du poids noté.
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {titre ? <Text style={commonStyles.lineSemiBold}>{titre}</Text> : null}
          {visible ? <Contenu key={titre} valeurInitiale={valeurInitiale} onValider={onValider} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Contenu({ valeurInitiale, onValider }: Pick<Props, 'valeurInitiale' | 'onValider'>) {
  const [texte, setTexte] = useState(valeurInitiale !== undefined ? String(valeurInitiale).replace('.', ',') : '');
  return (
    <View style={commonStyles.row}>
      <View style={commonStyles.flex1}>
        <FormField
          label={TEXTES.cheptel.ficheChevre.poids}
          value={texte}
          onChangeText={setTexte}
          keyboardType="decimal-pad"
          placeholder="kg"
        />
      </View>
      <View style={{ justifyContent: 'flex-end' }}>
        <Button variant="secondary" label={TEXTES.cheptel.reservation.ok} onPress={() => onValider(lirePoids(texte))} />
      </View>
    </View>
  );
}
