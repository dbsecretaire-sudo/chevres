import { useCallback } from 'react';
import { ScrollView, Text } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { LigneElement } from '@/features/dossiers/components/LigneElement';
import { useExplorateur } from '@/features/dossiers/hooks/useExplorateur';
import { enregistrerElement } from '@/features/dossiers/repository';
import { cheminDuDossier } from '@/features/dossiers/services/arborescence';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { formatDateFR } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Les tâches d'un jour : les contenus dont l'échéance tombe ce jour-là, ceux qui restent à faire d'abord. On y arrive
 * depuis le calendrier de l'accueil, et chaque tâche ouvre son contenu dans l'onglet Activité.
 */
export default function JourEcheances() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const e = useExplorateur();
  const T = TEXTES.dossiers.echeances;
  const { recharger } = e;

  useFocusEffect(
    useCallback(() => {
      recharger();
    }, [recharger]),
  );

  const taches = e.archive.elements
    .filter((element) => element.echeance === date)
    .sort(
      (a, b) =>
        Number(a.statut === STATUT_ELEMENT.TERMINE) - Number(b.statut === STATUT_ELEMENT.TERMINE) ||
        a.titre.localeCompare(b.titre),
    );

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: T.titre(formatDateFR(date)) }} />
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        {taches.length === 0 ? (
          <EmptyState title={T.aucune} subtitle={T.aucuneDetail} />
        ) : (
          <>
            <Text style={styles.titreSection}>{TEXTES.dossiers.explorateur.resultatsContenus}</Text>
            {taches.map((element) => (
              <LigneElement
                key={element.id}
                element={element}
                chemin={cheminDuDossier(element.dossierId, e.archive.sousDossiers, e.clients)}
                onStatut={async (statut) => {
                  await enregistrerElement({ ...element, statut });
                  recharger();
                }}
              />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
