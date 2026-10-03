import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import type { Facture } from '@/features/comptabilite/types';
import type { ResumeFournisseur } from '@/features/fournisseurs/services/resumeFournisseur';
import { ROUTES } from '@/shared/constants/routes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/fournisseurs/FicheFournisseur.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Carte « total payé » à ce fournisseur. */
export function FournisseurTotal({ resume }: { resume: ResumeFournisseur }) {
  return (
    <Card style={styles.totalCard}>
      <Text style={commonStyles.caption}>{TEXTES.fournisseurs.ficheFournisseur.totalPayeACeFournisseur}</Text>

      {resume.aAlimentation ? (
        <>
          <Text style={commonStyles.captionTop}>
            <Text style={styles.totalValeur}>{formatMontant(resume.totalHorsAutre)}</Text>
          </Text>

          <Text style={commonStyles.captionTop}>
            {TEXTES.fournisseurs.ficheFournisseur.totalAvecAutreDeuxPoints}
            {formatMontant(resume.totalComplet)}
          </Text>
        </>
      ) : (
        <Text style={styles.totalValeur}>{formatMontant(resume.totalComplet)}</Text>
      )}
    </Card>
  );
}

/** Liste des factures reçues de ce fournisseur. */
export function FournisseurEcritures({ ecritures }: { ecritures: Facture[] }) {
  const router = useRouter();

  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>
        {TEXTES.commun.general.ecrituresLiees}
        {ecritures.length > 0 ? ` (${ecritures.length})` : ''}
      </Text>
      {ecritures.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>
          {TEXTES.fournisseurs.ficheFournisseur.aucuneEcritureLieeACe}
        </Text>
      ) : (
        ecritures.map((f) => (
          <ListRow
            key={f.id}
            title={f.description || TEXTES.commun.general.facture}
            subtitle={formatDateFR(f.date)}
            trailing={<Text style={styles.montantEcriture}>-{formatMontant(f.montant)}</Text>}
            onPress={() => router.push(ROUTES.ficheFacture(f.id))}
          />
        ))
      )}
    </View>
  );
}
