import { useState, type ComponentProps } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.listesChoix;

interface Props {
  visible: boolean;
  titre: string;
  /** Vrai : on crée une catégorie (son nom et son compte) ; faux : on change seulement le compte d'une catégorie ajoutée. */
  avecNom: boolean;
  compteInitial?: string;
  options: ComponentProps<typeof SelectField<string>>['options'];
  onValider: (nom: string, compte: string) => void;
  onAnnuler: () => void;
}

/**
 * La fenêtre d'une catégorie de dépense (poste de comptabilité) : le nom d'une nouvelle catégorie et son compte du plan comptable, ou seulement le compte d'une catégorie ajoutée.
 * Elle remplace le formulaire sous la liste : le bouton « Nouvelle catégorie » est sous le tableau, comme les autres ajouts.
 */
export function FenetreCategorieDepense({ visible, titre, avecNom, compteInitial = '', options, onValider, onAnnuler }: Props) {
  const [nom, setNom] = useState('');
  const [compte, setCompte] = useState(compteInitial);
  const valide = (!avecNom || nom.trim().length > 0) && compte.length > 0;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <View style={styles.fond}>
        <View style={styles.fenetre}>
          <Text style={styles.titre}>{titre}</Text>
          {avecNom ? <FormField label={T.nouvelleCategorie} value={nom} onChangeText={setNom} placeholder={T.exempleCategorie} /> : null}
          <SelectField<string> label={T.compte} searchable value={compte} onChange={setCompte} options={options} aide={avecNom ? T.compteAide : undefined} />
          <View style={styles.boutons}>
            <Button variant="secondary" label={TEXTES.commun.general.annuler} onPress={onAnnuler} />
            <Button label={avecNom ? T.ajouter : TEXTES.commun.general.enregistrer} disabled={!valide} onPress={() => onValider(nom.trim(), compte)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  fenetre: { width: '100%', maxWidth: 520, backgroundColor: colors.surface, borderRadius: 12, padding: 18, gap: 12 },
  titre: { fontSize: 17, fontWeight: '800', color: colors.text },
  boutons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});
