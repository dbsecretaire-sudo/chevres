import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ListRow } from '@/shared/components/ListRow';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import { SENS_TRANSACTION, SOURCE_TRANSACTION } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/comptabilite/ListeTransactions.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Une vente ou une facture dans la liste des écritures ; ouvre sa fiche. */
export function LigneTransaction({ item }: { item: Transaction }) {
  const router = useRouter();
  const estEntree = item.sens === SENS_TRANSACTION.ENTREE;
  const signe = estEntree ? '+' : '-';
  const estFacture = item.source === SOURCE_TRANSACTION.FACTURE;

  return (
    <ListRow
      title={item.titre}
      subtitle={
        estFacture ? (
          <Text>
            {[formatDateFR(item.date), item.sousTitre].filter(Boolean).join(' · ')}
            {' · '}
            <Text style={commonStyles.strong}>
              {signe}
              {formatMontant(item.montant ?? 0)}
            </Text>
          </Text>
        ) : (
          formatDateFR(item.date)
        )
      }
      trailing={
        <Text style={[styles.montant, { color: estEntree ? colors.primary : colors.danger }]}>
          {item.montantComptabilise !== undefined
            ? `${signe}${formatMontant(item.montantComptabilise)}`
            : '—'}
        </Text>
      }
      onPress={() => router.push(estFacture ? ROUTES.ficheFacture(item.id) : ROUTES.ficheVente(item.id))}
    />
  );
}
