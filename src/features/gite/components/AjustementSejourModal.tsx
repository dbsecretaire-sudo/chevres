import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { TYPE_AJUSTEMENT_SEJOUR } from '@/shared/constants/gite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { todayISO } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type TypeAjustement = ValeurDe<typeof TYPE_AJUSTEMENT_SEJOUR>;

interface Props {
  /** Ce qu'on ajoute au séjour payé ; la fenêtre est fermée quand il est absent. */
  type: TypeAjustement | null;
  /** Le total payé par le client à ce jour : proposé comme montant d'un remboursement (rendre tout), modifiable. */
  totalPaye: number;
  onValider: (valeurs: { montant: number; date: string; maintenue: boolean }) => void;
  onFermer: () => void;
}

const T = TEXTES.gite.sejour.ajustement;

/**
 * Petite fenêtre flottante pour un remboursement du client (montant, date, et s'il garde sa réservation) ou une prestation
 * supplémentaire (montant et date). L'un comme l'autre est inscrit en comptabilité.
 */
export function AjustementSejourModal({ type, totalPaye, onValider, onFermer }: Props) {
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState(todayISO());
  const [maintenue, setMaintenue] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart d'un formulaire vide, à la date du jour.
    if (type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMontant(
        type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT && totalPaye > 0
          ? String(totalPaye).replace('.', ',')
          : '',
      );
      setDate(todayISO());
      setMaintenue(true);
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const valider = () => {
    const valeur = parseDecimal(montant);
    if (!(valeur > 0)) return setErreur(T.montantInvalide);
    onValider({ montant: valeur, date, maintenue });
  };

  const remboursement = type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT;

  return (
    <Modal visible={!!type} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{remboursement ? T.remboursement : T.prestation}</Text>
          <FormField
            label={T.montant}
            required
            value={montant}
            onChangeText={(texte) => {
              setMontant(texte);
              setErreur(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          <DateField label={T.date} required value={date} onChange={setDate} />
          {remboursement ? <Checkbox label={T.maintenue} value={maintenue} onChange={setMaintenue} /> : null}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
