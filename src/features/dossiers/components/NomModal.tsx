import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  visible: boolean;
  titre: string;
  /** Nom proposé à l'ouverture (celui du dossier qu'on renomme). */
  valeurInitiale?: string;
  placeholder?: string;
  onValider: (nom: string) => void;
  onAnnuler: () => void;
  /** Des champs de plus sous le nom (ex : le choix de l'activité). */
  enfants?: ReactNode;
}

/** Petite fenêtre qui demande un nom (nouveau dossier, renommer un dossier). */
export function NomModal({
  visible,
  titre,
  valeurInitiale = '',
  placeholder,
  onValider,
  onAnnuler,
  enfants,
}: Props) {
  const [nom, setNom] = useState(valeurInitiale);

  useEffect(() => {
    // Chaque ouverture repart du nom proposé.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setNom(valeurInitiale);
  }, [visible, valeurInitiale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={commonStyles.backdrop} onPress={onAnnuler}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{titre}</Text>
          <View style={styles.champNom}>
            <FormField value={nom} onChangeText={setNom} placeholder={placeholder} />
          </View>
          {enfants}
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onAnnuler}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.commun.general.enregistrer}
              disabled={!nom.trim()}
              onPress={() => onValider(nom.trim())}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
