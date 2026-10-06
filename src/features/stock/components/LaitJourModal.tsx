import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import type { LaitJour } from '@/features/stock/types';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  /** Le litrage qu'on modifie ; absent pour en noter un nouveau. */
  entree?: LaitJour;
  onValider: (valeurs: { id?: string; date: string; litres: number }) => void;
  onSupprimer: () => void;
  onFermer: () => void;
}

const T = TEXTES.stock.laitJour;

/** Petite fenêtre pour noter le lait d'un jour (la date, aujourd'hui d'office, et le nombre de litres). */
export function LaitJourModal({ visible, entree, onValider, onSupprimer, onFermer }: Props) {
  const [date, setDate] = useState(todayISO());
  const [litres, setLitres] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart du litrage modifié, ou d'un formulaire vide à la date du jour.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(entree?.date ?? todayISO());
      setLitres(entree ? String(entree.litres).replace('.', ',') : '');
      setErreur(null);
    }
  }, [visible, entree]);

  const valider = () => {
    const valeur = parseDecimal(litres);
    if (!(valeur > 0)) return setErreur(T.litresInvalides);
    onValider({ id: entree?.id, date, litres: valeur });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{entree ? T.modifier : T.ajouter}</Text>
          <DateField label={T.date} required value={date} onChange={setDate} />
          <FormField
            label={T.litres}
            required
            value={litres}
            onChangeText={(texte) => {
              setLitres(texte);
              setErreur(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onFermer}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
          {entree ? <Button variant="danger" label={T.supprimer} onPress={onSupprimer} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
