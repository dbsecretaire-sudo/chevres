import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ListRow } from '@/shared/components/ListRow';
import type { Transaction } from '@/features/comptabilite/services/transactions';
import { CATEGORIE_DEPENSE, SENS_TRANSACTION, SOURCE_TRANSACTION } from '@/shared/constants/comptabilite';
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
  /** Le total de la facture se lit dans le sous-titre pour une facture d'alimentation (répartie entre cheptels : à droite, la part comptabilisée). */
  const montantDansLeSousTitre =
    estFacture && !estEntree && item.categorie === CATEGORIE_DEPENSE.ALIMENTATION;

  return (
    <ListRow
      title={item.titre}
      subtitle={
        <Text>
          {[formatDateFR(item.date), item.sousTitre].filter(Boolean).join(' · ')}
          {montantDansLeSousTitre ? (
            <>
              <Text> · </Text>
              <Text style={commonStyles.strong}>
                {signe}
                {formatMontant(item.montant ?? 0)}
              </Text>
            </>
          ) : null}
        </Text>
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
