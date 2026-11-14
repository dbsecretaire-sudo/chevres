import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AvertissementDelais } from '@/features/sante/components/AvertissementDelais';
import { FormField } from '@/shared/components/FormField';
import { Card } from '@/shared/components/Card';
import { ChampMontantTtc } from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { libelleAnimalVendu } from '@/features/comptabilite/utils/animauxVendus';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { ChampTauxTvaVente, type Props } from '@/features/comptabilite/components/ecriture/vente/outilsVente';

/**
 * Vente d'un animal sur pied ou vivant : nombre de têtes, poids (facultatif), prix, TVA et précision facultative.
 * Un départ d'animaux vivants (depuis la liste des ventes ou l'assistant du lot) : ses animaux sont listés, et leur nombre ne se change pas.
 */
export function ChampsVenteAnimal({ e }: Props) {
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  useEffect(() => {
    if (!e.departVerrouille) return;
    listTousLesAnimauxDeLEspece()
      .then(setAnimaux)
      .catch(() => undefined);
  }, [e.departVerrouille]);
  const duDepart = e.animaux
    .map((id) => animaux.find((a) => a.id === id))
    .filter((a): a is Chevre => !!a);
  return (
    <>
      <AvertissementDelais type="viande" date={e.dateAbattoir || e.date} />
      {e.departVerrouille ? (
        <Card style={commonStyles.gap6}>
          <Text style={commonStyles.lineSemiBold}>{TEXTES.comptabilite.nouvelleEcriture.animauxDuDepart}</Text>
          {duDepart.map((a) => (
            <Text key={a.id} style={commonStyles.valueText}>
              {libelleAnimalVendu(a)}
            </Text>
          ))}
        </Card>
      ) : null}
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.comptabilite.nouvelleEcriture.nombreDeTetes}
            required
            value={e.quantite}
            onChangeText={e.setQuantite}
            editable={!e.departVerrouille}
            style={e.departVerrouille ? commonStyles.verrouille : undefined}
            keyboardType="decimal-pad"
            placeholder={TEXTES.comptabilite.nouvelleEcriture.ex2}
          />
        </View>
        <View style={commonStyles.flex1}>
          <FormField
            label={TEXTES.commun.general.poidsKg}
            value={e.poidsKg}
            onChangeText={e.setPoidsKg}
            keyboardType="decimal-pad"
            placeholder={TEXTES.commun.general.facultatif}
          />
        </View>
      </View>
      <View style={commonStyles.row}>
        <View style={commonStyles.flex1}>
          <ChampMontantTtc
            label={TEXTES.comptabilite.nouvelleEcriture.prixTotalTtc}
            value={e.montant}
            onChange={e.setMontant}
          />
        </View>
        <View style={commonStyles.flex1}>
          <ChampTauxTvaVente e={e} />
        </View>
      </View>
    </>
  );
}
