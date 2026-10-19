import { Text, View } from 'react-native';
import { formatMontant } from '@/shared/utils/dates';
import { SuggestionParcours } from '@/features/didacticiel/components/SuggestionParcours';
import { ChampPrixPersonnalise } from '@/features/comptabilite/components/ecriture/ChampPrixPersonnalise';
import { AvertissementDelais } from '@/features/exploitation/components/AvertissementDelais';
import { FormField } from '@/shared/components/FormField';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { useTotalVerrouille, usePrixInventaire, ChampTauxTvaVente, type Props } from '@/features/comptabilite/components/ecriture/vente/outilsVente';

/** Vente de lait : litrage, prix (facultatif) et TVA. */
export function ChampsVenteLait({ e }: Props) {
  const prixDuLitre = usePrixInventaire('lait');
  useTotalVerrouille(e, prixDuLitre, e.quantite);
  return (
    <>
      <SuggestionParcours parcoursId="vente-lait" />
      {/* Des femelles traitées, dont le lait ne doit pas être livré : l'avertissement s'affiche tant que leur délai court. */}
      <AvertissementDelais type="lait" date={e.date} />
      {/* Un réajustement n'a pas de litrage. */}
      {e.reajustement ? null : (
        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.litrage}
          required
          value={e.quantite}
          onChangeText={e.setQuantite}
          keyboardType="decimal-pad"
          placeholder={TEXTES.comptabilite.nouvelleEcriture.ex125}
          aide={e.prixLibre ? undefined : TEXTES.comptabilite.nouvelleEcriture.aideLitrage}
        />
      )}
      <View style={commonStyles.row}>
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
      <ChampPrixPersonnalise e={e} unite="litre" prixInventaire={prixDuLitre} />
      {e.prixLibre ? (
        <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.prixLibreRecolteur}</Text>
      ) : (
        <Text style={commonStyles.note}>
          {prixDuLitre
            ? TEXTES.comptabilite.nouvelleEcriture.prixLitreInventaire(formatMontant(prixDuLitre))
            : TEXTES.comptabilite.nouvelleEcriture.aucunPrixInventaire}
        </Text>
      )}
    </>
  );
}
