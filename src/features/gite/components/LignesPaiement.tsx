import { Text, View } from 'react-native';
import type { AcompteSejour, AjustementSejour } from '@/features/gite/types';
import { TYPE_AJUSTEMENT_SEJOUR } from '@/shared/constants/gite';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/gite/Gite.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** Le solde payé (total moins l'acompte) et sa date ; absents tant que le séjour n'est pas payé. */
  paiement?: { montant: number; date: string };
  acompte?: AcompteSejour;
  ajustements: AjustementSejour[];
}

const T = TEXTES.gite.sejour.lignesPaiement;

/**
 * Ce qui a été encaissé ou rendu pour un séjour, une ligne par mouvement, le montant à droite : le paiement, l'acompte,
 * puis « Autre » (remboursements et prestations supplémentaires, avec leur date).
 */
export function LignesPaiement({ paiement, acompte, ajustements }: Props) {
  return (
    <View style={commonStyles.gap6}>
      {paiement ? (
        <View style={commonStyles.rowSpaceBetween}>
          <Text style={commonStyles.line}>{T.paiementDu(formatDateFR(paiement.date))}</Text>
          <Text style={commonStyles.lineBold}>{formatMontant(paiement.montant)}</Text>
        </View>
      ) : null}
      {acompte ? (
        <View style={commonStyles.rowSpaceBetween}>
          <Text style={commonStyles.line}>{T.acompteDu(formatDateFR(acompte.date))}</Text>
          <Text style={commonStyles.lineBold}>{formatMontant(acompte.montant)}</Text>
        </View>
      ) : null}
      {ajustements.length > 0 ? (
        <>
          <Text style={commonStyles.line}>{T.autre}</Text>
          {ajustements.map((a) => {
            const remboursement = a.type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT;
            return (
              <View key={a.id} style={[commonStyles.rowSpaceBetween, styles.sousLignePaiement]}>
                <View style={commonStyles.flex1}>
                  <Text style={commonStyles.muted}>{remboursement ? T.remboursement : T.prestation}</Text>
                  <Text style={commonStyles.muted}>{formatDateFR(a.date)}</Text>
                  {remboursement && a.maintenue ? (
                    <Text style={commonStyles.muted}>{T.maintenue}</Text>
                  ) : null}
                </View>
                <Text style={commonStyles.lineBold}>
                  {remboursement ? '−' : '+'}
                  {formatMontant(a.montant)}
                </Text>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}
