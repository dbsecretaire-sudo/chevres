import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { getChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import type { Vente } from '@/features/comptabilite/types';
import { libelleAnimalVendu } from '@/features/comptabilite/utils/animauxVendus';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Les animaux d'une vente (ceux qu'on a désignés dans le cheptel en l'enregistrant), présentés comme dans le formulaire de
 * vente : leur n° de boucle (ou « sans boucle »), M ou F, et leur date de naissance. Rien quand la vente n'en désigne aucun.
 */
export function AnimauxDeLaVente({ vente }: { vente: Vente }) {
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const ids = idsDesAnimaux(vente).join(',');

  useFocusEffect(
    useCallback(() => {
      Promise.all(ids.split(',').filter(Boolean).map(getChevre)).then((trouves) =>
        setAnimaux(trouves.filter((a): a is Chevre => !!a)),
      );
    }, [ids]),
  );

  if (animaux.length === 0) return null;
  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineSemiBold}>{TEXTES.comptabilite.nouvelleEcriture.animauxVendus}</Text>
      <Card style={commonStyles.gap10}>
        {animaux.map((animal) => (
          <Text key={animal.id} style={commonStyles.valueText}>
            {libelleAnimalVendu(animal)}
          </Text>
        ))}
      </Card>
    </View>
  );
}
