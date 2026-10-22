import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
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
      {/* Les lots d'animaux : l'icône à droite du titre (vétérinaire, abattoir, vente, équarrissage…). */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={commonStyles.boutonEnteteDroite}
              onPress={() => ouvrir(ROUTES.CHEPTEL_LOTS)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={TEXTES.cheptel.lots.titre}
            >
              <Ionicons name="layers" size={24} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
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
