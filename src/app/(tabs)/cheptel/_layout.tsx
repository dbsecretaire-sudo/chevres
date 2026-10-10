import { Stack } from 'expo-router';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import { BoutonBilanCheptel } from '@/features/cheptel/components/BoutonBilanCheptel';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export default function CheptelLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  return (
    <Stack
      // Les écrans à sélecteur d'espèce suivent l'espèce active en se rechargeant : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf('index', 'liste', 'bilan', 'historique', 'naissances')}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.commun.general.cheptel }} />
      <Stack.Screen
        name="liste"
        options={{ title: TEXTES.cheptel.listeCheptel.titre, headerRight: () => <BoutonBilanCheptel /> }}
      />
      <Stack.Screen name="[id]" options={{ title: TEXTES.navigation.layout.ficheChevre }} />
      <Stack.Screen
        name="nouvelle"
        options={{
          title: TEXTES.navigation.layout.nouvelleChevre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
          headerLeft: () => <HeaderBackTo to={ROUTES.CHEPTEL_LISTE} />,
        }}
      />
      <Stack.Screen
        name="naissance-nouvelle"
        options={{
          title: TEXTES.navigation.layout.declarerUneNaissance,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen
        name="ajout-rapide"
        options={{
          title: TEXTES.navigation.layout.ajoutRapide,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="naissances" options={{ title: TEXTES.navigation.layout.naissances }} />
      <Stack.Screen
        name="historique"
        options={{ title: TEXTES.navigation.layout.historiqueMortesAbattoirVendues }}
      />
      <Stack.Screen name="bilan" options={{ title: TEXTES.commun.general.bilanAnnuel }} />
    </Stack>
  );
}
