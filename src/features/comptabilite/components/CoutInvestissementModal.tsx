import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { formatMontant } from '@/shared/utils/dates';
import { parseMontant } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.rentabilite.plan.investissements;

interface Props {
  visible: boolean;
  /** Le nom de l'investissement (silo à grain, cuve à gazole). */
  titre: string;
  /** Le coût déjà indiqué (€). */
  cout?: number;
  /** Reçoit le coût saisi ; sans coût, il est retiré. */
  onValider: (cout: number | undefined) => void;
  onFermer: () => void;
}

/** Le coût estimé d'un investissement du plan d'économies : il sert à calculer le temps de remboursement. */
export function CoutInvestissementModal({ visible, titre, cout, onValider, onFermer }: Props) {
  const [saisi, setSaisi] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaisi(cout ? formatMontant(cout) : '');
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const valider = () => {
    const montant = parseMontant(saisi);
    if (saisi.trim() && !(montant > 0)) return setErreur(T.coutInvalide);
    onValider(montant > 0 ? montant : undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{titre}</Text>
          <FormField
            label={T.coutLabel}
            value={saisi}
            onChangeText={setSaisi}
            onBlur={() => parseMontant(saisi) > 0 && setSaisi(formatMontant(parseMontant(saisi)))}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <Text style={commonStyles.note}>{T.coutAide}</Text>
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
