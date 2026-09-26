import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FormField } from './FormField';
import { DateField } from './DateField';
import { Button } from './Button';
import { colors } from '@/theme/colors';

export interface FiltresTransactions {
  dateDebut: string;
  dateFin: string;
  montantMin: string;
  montantMax: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  valeur: FiltresTransactions;
  onChange: (v: FiltresTransactions) => void;
}

export function FiltreTransactionsModal({ visible, onClose, valeur, onChange }: Props) {
  const maj = (patch: Partial<FiltresTransactions>) => onChange({ ...valeur, ...patch });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.titre}>Filtrer</Text>

          <Text style={styles.section}>Période</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <DateField label="Du" value={valeur.dateDebut} onChange={(v) => maj({ dateDebut: v })} />
            </View>
            <View style={styles.flex1}>
              <DateField label="Au" value={valeur.dateFin} onChange={(v) => maj({ dateFin: v })} />
            </View>
          </View>

          <Text style={styles.section}>Montant (€)</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormField label="Min" value={valeur.montantMin} onChangeText={(v) => maj({ montantMin: v })} keyboardType="decimal-pad" placeholder="0" />
            </View>
            <View style={styles.flex1}>
              <FormField label="Max" value={valeur.montantMax} onChangeText={(v) => maj({ montantMax: v })} keyboardType="decimal-pad" placeholder="ex: 500" />
            </View>
          </View>

          <View style={styles.row}>
            <Button
              style={styles.flex1}
              variant="secondary"
              label="Réinitialiser"
              onPress={() => onChange({ dateDebut: '', dateFin: '', montantMin: '', montantMax: '' })}
            />
            <Button style={styles.flex1} label="Appliquer" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  titre: { fontSize: 16, fontWeight: '800', color: colors.text },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
