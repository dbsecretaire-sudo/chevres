import { useCallback, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ActiviteGiteModal } from '@/features/gite/components/ActiviteGiteModal';
import { colors } from '@/shared/theme/colors';
import { Screen } from '@/shared/components/ScreenList';
import { CalendrierMois, type MarqueJour } from '@/shared/components/CalendrierMois';
import { Fab } from '@/shared/components/Fab';
import { listSejours } from '@/features/gite/repository';
import { chambresOccupeesParNuit, nuitsAvecPaiementEnAttente } from '@/features/gite/services/occupation';
import type { Sejour } from '@/features/gite/types';
import { useChambres } from '@/features/gite/hooks/useChambres';
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
  const { chambres } = useChambres();
  const [menu, setMenu] = useState(false);
  const [activiteOuverte, setActiviteOuverte] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listSejours().then(setSejours);
    }, []),
  );

  const occupation = chambresOccupeesParNuit(sejours);
  const impayees = nuitsAvecPaiementEnAttente(sejours);
  const marque = (jour: string): MarqueJour => {
    const occupees = occupation.get(jour) ?? 0;
    if (occupees === 0) return {};
    return {
      texte: T.occupation(occupees, chambres.length),
      niveau: occupees >= chambres.length ? 'plein' : 'partiel',
      attention: impayees.has(jour),
    };
  };

  return (
    <Screen scroll={false}>
      {/* Le menu burger : « Modifier l'activité » (le compte du plan comptable et la TVA de l'hébergement). */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={commonStyles.boutonEnteteDroite}
              onPress={() => setMenu(true)}
              hitSlop={10}
              accessibilityLabel={TEXTES.gite.activite.menu}
            >
              <Ionicons name="menu" size={26} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <OptionsModal
        visible={menu}
        onClose={() => setMenu(false)}
        options={[
          {
            label: TEXTES.gite.activite.modifier,
            icon: 'create',
            onPress: () => {
              setMenu(false);
              setActiviteOuverte(true);
            },
          },
          {
            label: TEXTES.gite.activite.historique,
            icon: 'time',
            onPress: () => {
              setMenu(false);
              router.push(ROUTES.giteHistorique());
            },
          },
        ]}
      />
      <ActiviteGiteModal visible={activiteOuverte} onFermer={() => setActiviteOuverte(false)} />
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
