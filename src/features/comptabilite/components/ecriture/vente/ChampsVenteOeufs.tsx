import { Pressable, Text, View } from 'react-native';
import { formatMontant } from '@/shared/utils/dates';
import { useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { ChampPrixPersonnalise } from '@/features/comptabilite/components/ecriture/ChampPrixPersonnalise';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { FormField } from '@/shared/components/FormField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import { SECTION_STOCK } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { useTotalVerrouille, usePrixInventaire, ChampTauxTvaVente, type Props } from '@/features/comptabilite/components/ecriture/vente/outilsVente';

/** Vente d'œufs : nombre d'œufs, prix et TVA. */
export function ChampsVenteOeufs({ e }: Props) {
  // Choisir « vente d'œufs » lie la vente à la liste des œufs de l'inventaire (0,50 € l'œuf d'office).
  const router = useRouter();
  const retour = useAdresseCourante();
  const prixDeLOeuf = usePrixInventaire('oeufs');
  useTotalVerrouille(e, prixDeLOeuf, e.quantite);
  return (
    <>
      <View style={styles.row3}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDOeufs}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
            editable={e.prixLibre || e.prixPersonnalise}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
      <ChampPrixPersonnalise e={e} unite="piece" prixInventaire={prixDeLOeuf} />
      {/* Le crayon mène à la liste des œufs de l'inventaire, où se change le prix (le total se recalcule au retour). */}
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={[commonStyles.note, commonStyles.flex1]}>
          {prixDeLOeuf
            ? TEXTES.comptabilite.nouvelleEcriture.prixOeufInventaire(formatMontant(prixDeLOeuf))
            : TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}
        </Text>
        <Pressable
          onPress={() =>
            router.push(
              ROUTES.stockDepuis(
                retour,
                SECTION_STOCK.OEUFS,
                e.activite === ACTIVITE_COMMUNE ? undefined : e.activite,
              ),
            )
          }
          hitSlop={8}
          accessibilityLabel={TEXTES.comptabilite.nouvelleEcriture.modifierLePrixOeuf}
        >
          <Ionicons name="pencil" size={20} color={colors.ajout} />
        </Pressable>
      </View>
    </>
  );
}
