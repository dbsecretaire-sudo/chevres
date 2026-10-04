import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { CalendrierMois, type MarqueJour } from '@/shared/components/CalendrierMois';
import { Fab } from '@/shared/components/Fab';
import { listSejours } from '@/features/gite/repository';
import { chambresOccupeesParNuit } from '@/features/gite/services/occupation';
import type { Sejour } from '@/features/gite/types';
import { NOMBRE_CHAMBRES_GITE } from '@/shared/constants/gite';
import { ROUTES } from '@/shared/constants/routes';
import { moisDe, type MoisCalendrier } from '@/shared/utils/calendrier';
import { todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Le calendrier du gîte : pour chaque nuit, le nombre de chambres occupées ; un jour ouvre le couloir. */
export default function CalendrierGiteEcran() {
  const router = useRouter();
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [mois, setMois] = useState<MoisCalendrier>(() => moisDe(todayISO()));
  const T = TEXTES.gite.calendrier;

  useFocusEffect(
    useCallback(() => {
      listSejours().then(setSejours);
    }, []),
  );

  const occupation = chambresOccupeesParNuit(sejours);
  const marque = (jour: string): MarqueJour => {
    const occupees = occupation.get(jour) ?? 0;
    if (occupees === 0) return {};
    return {
      texte: T.occupation(occupees, NOMBRE_CHAMBRES_GITE),
      niveau: occupees >= NOMBRE_CHAMBRES_GITE ? 'plein' : 'partiel',
    };
  };

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <CalendrierMois
          mois={mois}
          onChangerMois={setMois}
          marque={marque}
          onJour={(jour) => router.push(ROUTES.giteJour(jour))}
          legende={T.legende}
        />
      </ScrollView>
      <Fab
        options={[
          {
            label: T.nouveauSejour,
            icon: 'bed',
            onPress: () => router.push(ROUTES.sejourNouveau(1, todayISO())),
          },
        ]}
      />
    </Screen>
  );
}
