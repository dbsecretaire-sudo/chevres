import { Modal, Pressable, Text, View } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { DateField } from '@/shared/components/DateField';
import { Button } from '@/shared/components/Button';
import { styles } from '@/shared/styles/comptabilite/FiltreTransactionsModal.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

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
  /** L'année active : les dates du filtre sont de cette année (seuls le mois et le jour se saisissent). */
  annee: number;
  /** Vrai quand « Tout » est choisi : l'année des dates du filtre est libre. */
  anneeLibre: boolean;
}

export function FiltreTransactionsModal({ visible, onClose, valeur, onChange, annee, anneeLibre }: Props) {
  const maj = (patch: Partial<FiltresTransactions>) => onChange({ ...valeur, ...patch });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.titre}>{TEXTES.commun.general.filtrer}</Text>

          <Text style={styles.section}>{TEXTES.comptabilite.filtreTransactionsModal.periode}</Text>
          <View style={commonStyles.row}>
            <View style={commonStyles.flex1}>
              <DateField
                label={TEXTES.comptabilite.filtreTransactionsModal.du}
                value={valeur.dateDebut}
                onChange={(v) => maj({ dateDebut: v })}
                anneeImposee={anneeLibre ? undefined : annee}
                jourMoisAnnee
              />
            </View>
            <View style={commonStyles.flex1}>
              <DateField
                label={TEXTES.comptabilite.filtreTransactionsModal.au}
                value={valeur.dateFin}
                onChange={(v) => maj({ dateFin: v })}
                anneeImposee={anneeLibre ? undefined : annee}
                jourMoisAnnee
              />
            </View>
          </View>

          <Text style={styles.section}>{TEXTES.comptabilite.filtreTransactionsModal.montant}</Text>
          <View style={commonStyles.row}>
            <View style={commonStyles.flex1}>
              <FormField
                label={TEXTES.comptabilite.filtreTransactionsModal.min}
                value={valeur.montantMin}
                onChangeText={(v) => maj({ montantMin: v })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={commonStyles.flex1}>
              <FormField
                label={TEXTES.comptabilite.filtreTransactionsModal.max}
                value={valeur.montantMax}
                onChangeText={(v) => maj({ montantMax: v })}
                keyboardType="decimal-pad"
                placeholder={TEXTES.comptabilite.filtreTransactionsModal.ex500}
              />
            </View>
          </View>

          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.comptabilite.filtreTransactionsModal.reinitialiser}
              onPress={() => onChange({ dateDebut: '', dateFin: '', montantMin: '', montantMax: '' })}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.comptabilite.filtreTransactionsModal.appliquer}
              onPress={onClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
