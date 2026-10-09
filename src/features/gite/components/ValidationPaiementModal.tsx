import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { useAnneeImposee } from '@/features/settings/hooks/useAnneeImposee';
import { parseDecimal } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  /** Faux quand un acompte est déjà enregistré : on ne propose alors que de valider le paiement. */
  acomptePossible: boolean;
  onValider: () => void;
  onAcompte: (acompte: { montant: number; date: string }) => void;
  onFermer: () => void;
}

const T = TEXTES.gite.sejour;

/**
 * Message flottant qui s'ouvre sur « Valider le paiement » : il prévient que la validation fige le séjour et propose, au
 * choix, de valider (Oui), d'annuler, ou d'enregistrer un acompte (montant et date) qui n'a pas cet effet.
 */
export function ValidationPaiementModal({ visible, acomptePossible, onValider, onAcompte, onFermer }: Props) {
  const [saisieAcompte, setSaisieAcompte] = useState(false);
  const [montant, setMontant] = useState('');
  const { anneeImposee, dateDuJour } = useAnneeImposee();
  const [date, setDate] = useState(dateDuJour);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart du message de confirmation.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaisieAcompte(false);
      setMontant('');
      setDate(dateDuJour);
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const enregistrerAcompte = () => {
    const valeur = parseDecimal(montant);
    if (!(valeur > 0)) return setErreur(T.acompte.montantInvalide);
    onAcompte({ montant: valeur, date });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {saisieAcompte ? (
            <>
              <Text style={commonStyles.subheading}>{T.acompte.titre}</Text>
              <FormField
                label={T.acompte.montant}
                required
                value={montant}
                onChangeText={(texte) => {
                  setMontant(texte);
                  setErreur(null);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <DateField
                label={T.acompte.date}
                required
                value={date}
                onChange={setDate}
                anneeImposee={anneeImposee}
                jourMoisAnnee
              />
              {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}
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
                  onPress={enregistrerAcompte}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={commonStyles.subheading}>{T.validerPaiement}</Text>
              <Text style={commonStyles.message}>{T.validation.message}</Text>
              <View style={commonStyles.row}>
                <Button
                  style={commonStyles.flex1}
                  variant="secondary"
                  label={TEXTES.commun.general.annuler}
                  onPress={onFermer}
                />
                <Button style={commonStyles.flex1} label={T.validation.oui} onPress={onValider} />
              </View>
              {acomptePossible ? (
                <Button
                  variant="secondary"
                  label={T.validation.acompte}
                  onPress={() => setSaisieAcompte(true)}
                />
              ) : null}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
