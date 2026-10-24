import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/ModalListeValeurs.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commun.listeModifiable;

interface Props {
  visible: boolean;
  titre: string;
  valeurs: string[];
  /** La liste d'origine : le bouton « Rétablir » la remet. */
  valeursParDefaut: readonly string[];
  onValider: (valeurs: string[]) => void;
  onAnnuler: () => void;
}

/**
 * La fenêtre qui modifie une liste de valeurs (motifs, codes…) : chaque valeur se réécrit ou se retire, on en ajoute, et la liste
 * d'origine se rétablit. Rien n'est gardé avant « Enregistrer » ; les valeurs vides et les doublons sont écartés.
 */
export function ModalListeValeurs({
  visible,
  titre,
  valeurs,
  valeursParDefaut,
  onValider,
  onAnnuler,
}: Props) {
  const [brouillon, setBrouillon] = useState<string[]>(valeurs);

  useEffect(() => {
    // Chaque ouverture repart de la liste en cours.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setBrouillon(valeurs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const valider = () => {
    const nettoyees = brouillon.map((v) => v.trim()).filter(Boolean);
    onValider(nettoyees.filter((v, i) => nettoyees.indexOf(v) === i));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={commonStyles.backdrop} onPress={onAnnuler}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{titre}</Text>
          <ScrollView style={styles.liste} contentContainerStyle={commonStyles.gap10}>
            {brouillon.map((valeur, i) => (
              <View key={i} style={commonStyles.rowFin}>
                <View style={commonStyles.flex1}>
                  <FormField
                    value={valeur}
                    onChangeText={(v) => setBrouillon((l) => l.map((x, j) => (j === i ? v : x)))}
                    placeholder={T.valeur}
                  />
                </View>
                <Pressable
                  style={[commonStyles.boutonIcone, styles.retirer]}
                  onPress={() => setBrouillon((l) => l.filter((_, j) => j !== i))}
                  accessibilityLabel={T.retirer}
                >
                  <Ionicons name="trash" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          {/* Ajouter et rétablir : deux liens discrets sous la liste, pas deux grandes barres. */}
          <View style={styles.liens}>
            <Pressable style={styles.lien} onPress={() => setBrouillon((l) => [...l, ''])} accessibilityRole="button">
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.texteLien}>{T.ajouter}</Text>
            </Pressable>
            <Pressable style={styles.lien} onPress={() => setBrouillon([...valeursParDefaut])} accessibilityRole="button">
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.texteLien}>{T.retablir}</Text>
            </Pressable>
          </View>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.commun.general.annuler}
              onPress={onAnnuler}
            />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
