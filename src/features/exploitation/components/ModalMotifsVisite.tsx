import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/ModalListeValeurs.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.visite;
const L = TEXTES.commun.listeModifiable;

/** Un motif de la liste, coché ou non pour la visite. */
interface Ligne {
  valeur: string;
  coche: boolean;
}

interface Props {
  visible: boolean;
  /** Les motifs de la liste, et ceux que la visite a déjà (ils s'ouvrent cochés). */
  motifs: string[];
  choisis: string[];
  /** Les motifs cochés (dans l'ordre de la liste) et la liste, telle qu'on l'a modifiée. */
  onValider: (choisis: string[], liste: string[]) => void;
  onAnnuler: () => void;
}

/**
 * Les motifs d'une visite vétérinaire en cases à cocher : ceux de la visite sont déjà cochés ; le crayon devant chaque motif le renomme, « Ajouter une valeur » en
 * ajoute un. Un motif dont on vide le champ est retiré de la liste. Rien n'est gardé avant « Enregistrer ».
 */
export function ModalMotifsVisite({ visible, motifs, choisis, onValider, onAnnuler }: Props) {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  /** Le motif en cours de renommage (son rang), s'il y en a un. */
  const [enEdition, setEnEdition] = useState<number | null>(null);

  useEffect(() => {
    // Chaque ouverture repart de la liste en cours, motifs de la visite cochés.
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLignes([...motifs, ...choisis.filter((m) => !motifs.includes(m))].map((valeur) => ({ valeur, coche: choisis.includes(valeur) })));
    setEnEdition(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const valider = () => {
    const gardees = lignes.map((l) => ({ ...l, valeur: l.valeur.trim() })).filter((l) => l.valeur);
    const uniques = gardees.filter((l, i) => gardees.findIndex((x) => x.valeur === l.valeur) === i);
    onValider(
      uniques.filter((l) => l.coche).map((l) => l.valeur),
      uniques.map((l) => l.valeur),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <Pressable style={commonStyles.backdrop} onPress={onAnnuler}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.motifs}</Text>
          <ScrollView style={styles.liste} contentContainerStyle={commonStyles.gap10}>
            {lignes.map((ligne, i) => (
              <View key={i} style={commonStyles.rowFin}>
                <View style={commonStyles.flex1}>
                  {enEdition === i ? (
                    <FormField
                      value={ligne.valeur}
                      onChangeText={(v) => setLignes((l) => l.map((x, j) => (j === i ? { ...x, valeur: v } : x)))}
                      placeholder={L.valeur}
                    />
                  ) : (
                    <Checkbox
                      label={ligne.valeur}
                      value={ligne.coche}
                      onChange={(coche) => setLignes((l) => l.map((x, j) => (j === i ? { ...x, coche } : x)))}
                    />
                  )}
                </View>
                {/* Le crayon de chaque motif : il le renomme (vider le champ le retire de la liste). */}
                <Pressable
                  onPress={() => setEnEdition((courant) => (courant === i ? null : i))}
                  hitSlop={8}
                  accessibilityLabel={T.modifierMotifs}
                >
                  <Ionicons name={enEdition === i ? 'checkmark' : 'pencil'} size={20} color={colors.primary} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Pressable
            style={styles.lien}
            onPress={() => {
              setLignes((l) => [...l, { valeur: '', coche: true }]);
              setEnEdition(lignes.length);
            }}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.texteLien}>{L.ajouter}</Text>
          </Pressable>
          <View style={commonStyles.row}>
            <Button style={commonStyles.flex1} variant="secondary" label={TEXTES.commun.general.annuler} onPress={onAnnuler} />
            <Button style={commonStyles.flex1} label={TEXTES.commun.general.enregistrer} onPress={valider} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
