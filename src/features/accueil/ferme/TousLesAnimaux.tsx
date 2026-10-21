import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChevrerieInterieure } from '@/features/accueil/ferme/ChevrerieInterieure';
import { animauxVedettes } from '@/features/accueil/ferme/useFermeAccueil';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

/**
 * La page « Tous les animaux » : la chèvrerie (son mur, ses chèvres qui se promènent) et, sur la paille, la liste du troupeau avec sa recherche et ses
 * filtres, qui prend tout l'écran. Chaque ligne ouvre la fiche de l'animal.
 */
export default function TousLesAnimaux() {
  // L'espèce active : la page se recharge quand elle change, sans être recréée.
  const { espece } = useEtablissement();
  const [vedettes, setVedettes] = useState<Chevre[]>([]);
  useFocusEffect(
    useCallback(() => {
      listChevresVivantes()
        .then((vivants) => setVedettes(animauxVedettes(vivants)))
        .catch(() => undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- l'espèce change ce que la liste renvoie : on relit alors le troupeau
    }, [espece]),
  );
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChevrerieInterieure vedettes={vedettes} />
    </ScrollView>
  );
}
