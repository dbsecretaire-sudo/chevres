import { StyleSheet, Text, View } from 'react-native';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

/**
 * Le haut de la seconde étape, comme sur la maquette : le sens de l'écriture (débit ou crédit), son contact, sa date et son numéro de facture.
 */
export function ResumeEcriture({ e }: { e: EtatNouvelleEcriture }) {
  const recue = e.type === TYPE_FACTURE.RECUE;
  const sens = recue ? TEXTES.commun.general.debit : TEXTES.commun.general.credit;
  const contact = recue ? e.fournisseurSelectionne?.nom : e.clientSelectionne?.nom;
  const facture = recue ? e.description : e.avecFacture ? e.numeroFacture : '';
  return (
    <>
      <Text style={commonStyles.note}>Étape 2 sur 2</Text>
      <View style={styles.carte}>
        <Text style={styles.titre}>{contact ? `${sens} · ${contact}` : sens}</Text>
        <Text style={styles.detail}>{`${formatDateFR(e.date)}${facture ? ` · facture ${facture}` : ''}`}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  carte: { backgroundColor: colors.badgeBg, borderRadius: 12, padding: 12, gap: 2 },
  titre: { fontWeight: '700', color: colors.text },
  detail: { color: colors.textMuted },
});
