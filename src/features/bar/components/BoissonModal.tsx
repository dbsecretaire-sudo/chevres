import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import type { Boisson } from '@/features/bar/types';
import { formatMontant } from '@/shared/utils/dates';
import { parseMontant } from '@/shared/utils/nombres';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  /** La boisson qu'on modifie ; absente pour en créer une. */
  boisson?: Boisson;
  onValider: (nom: string, prix: number) => void;
  onSupprimer: () => void;
  onFermer: () => void;
}

/** Petite fenêtre pour ajouter une boisson (nom et prix) ou modifier / supprimer une boisson de la liste. */
export function BoissonModal({ visible, boisson, onValider, onSupprimer, onFermer }: Props) {
  const T = TEXTES.bar.bar;
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Chaque ouverture repart de la boisson modifiée, ou d'un formulaire vide.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNom(boisson?.nom ?? '');
      setPrix(boisson ? formatMontant(boisson.prix) : '');
      setErreur(null);
    }
  }, [visible, boisson]);

  const valider = () => {
    if (!nom.trim()) return setErreur(T.nomRequis);
    const montant = parseMontant(prix);
    if (!(montant > 0)) return setErreur(T.prixInvalide);
    onValider(nom.trim(), montant);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{boisson ? T.modifierBoisson : T.nouvelleBoisson}</Text>
          <FormField
            label={T.nomBoisson}
            required
            value={nom}
            onChangeText={setNom}
            placeholder={T.exempleNom}
          />
          <FormField
            label={T.prix}
            required
            value={prix}
            onChangeText={setPrix}
            keyboardType="decimal-pad"
            placeholder="0,00"
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
          {boisson ? <Button variant="danger" label={T.supprimerBoisson} onPress={onSupprimer} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
