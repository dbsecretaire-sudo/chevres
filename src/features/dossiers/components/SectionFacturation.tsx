import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { facturationRetirable } from '@/features/dossiers/services/facturation';
import type { Facturation } from '@/features/dossiers/types';
import { TYPE_FACTURATION } from '@/shared/constants/dossiers';
import { colors } from '@/shared/theme/colors';
import { LABEL_NATURE_URSSAF } from '@/shared/textes/libelles';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.dossiers.facturation;

interface Props {
  facturations: Facturation[];
  /** Vrai quand le contenu est terminé : c'est alors seulement qu'on le facture (un acompte, lui, se prend à tout moment). */
  termine: boolean;
  onFacturer: () => void;
  onAcompte: () => void;
  onRetirer: (facturation: Facturation) => void;
}

/** Ce qui est dit d'une facturation : sa facture ou son acompte (avec le numéro), sa place sur la note, ou la note facturée. */
function etat(l: Facturation): string {
  if (l.type === TYPE_FACTURATION.NOTE) {
    return l.factureId && l.numeroFacture ? T.noteFacturee(l.numeroFacture) : T.surLaNote;
  }
  return T.numeroDe(l.numeroFacture ?? '');
}

/**
 * La facturation d'un contenu du secrétariat : ses factures, acomptes et prestations sur la note (avec leur nature pour
 * l'URSSAF), les boutons pour facturer (une fois terminé) ou prendre un acompte.
 */
export function SectionFacturation({ facturations, termine, onFacturer, onAcompte, onRetirer }: Props) {
  return (
    <Card style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      {facturations.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucune}</Text> : null}
      {facturations.map((l) => (
        <View key={l.id} style={commonStyles.rowSpaceBetween}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.lineBold}>
              {T.types[l.type]} · {formatMontant(l.montant)}
            </Text>
            <Text style={commonStyles.note}>
              {formatDateFR(l.date)} · {LABEL_NATURE_URSSAF[l.nature]}
            </Text>
            <Text style={commonStyles.note}>{etat(l)}</Text>
          </View>
          {facturationRetirable(l) ? (
            <Pressable onPress={() => onRetirer(l)} hitSlop={8} accessibilityLabel={T.retirer}>
              <Ionicons name="trash" size={20} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {termine ? (
        <Button label={T.facturer} onPress={onFacturer} />
      ) : (
        <Text style={commonStyles.note}>{T.aFacturerQuandTermine}</Text>
      )}
      <Button variant="secondary" label={T.acompte} onPress={onAcompte} />
    </Card>
  );
}
