import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChevrerieInterieure } from '@/features/accueil/ferme/ChevrerieInterieure';
import { animauxVedettes } from '@/features/accueil/ferme/useFermeAccueil';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { Fab } from '@/shared/components/Fab';
import { ROUTES } from '@/shared/constants/routes';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { TEXTES } from '@/shared/textes';

/**
 * La page « Tous les animaux » : la chèvrerie (son mur, ses chèvres qui se promènent) et, sur la paille, la liste du troupeau avec sa recherche et ses
 * filtres, qui prend tout l'écran. Chaque ligne ouvre la fiche de l'animal.
 */
export default function TousLesAnimaux() {
  // L'espèce active : la page se recharge quand elle change, sans être recréée.
  const { espece } = useEtablissement();
  const ouvrir = useOuvrir();
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
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <ChevrerieInterieure vedettes={vedettes} />
      </ScrollView>
      {/* Ajouter un animal au cheptel : sa flèche de retour ramène ici. */}
      <Fab
        options={[
          {
            label: TEXTES.cheptel.listeCheptel.ajouterAuCheptel,
            icon: 'add-circle',
            onPress: () => ouvrir(ROUTES.CHEPTEL_AJOUT_RAPIDE),
          },
        ]}
      />
    </View>
  );
}
