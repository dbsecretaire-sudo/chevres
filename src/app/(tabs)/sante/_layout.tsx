import { Stack } from 'expo-router';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export default function SanteLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  return (
    <Stack
      // Les écrans à sélecteur d'espèce suivent l'espèce active en se rechargeant : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf('index', 'alimentation', 'veterinaire/index', 'controles/index')}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.sante.titre }} />
      <Stack.Screen name="alimentation" options={{ title: TEXTES.commun.general.alimentation }} />
      <Stack.Screen name="veterinaire/index" options={{ title: TEXTES.commun.general.visitesVeterinaire }} />
      <Stack.Screen
        name="veterinaire/nouvelle"
        options={{
          title: TEXTES.navigation.layout.nouvelleVisite,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="controles/index" options={{ title: TEXTES.commun.general.controles }} />
      <Stack.Screen
        name="controles/nouvelle"
        options={{
          title: TEXTES.navigation.layout.nouveauControle,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
    </Stack>
  );
}
