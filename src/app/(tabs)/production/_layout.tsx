import { Stack } from 'expo-router';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import type { FamilleControle } from '@/features/exploitation/types';
import { TEXTES } from '@/shared/textes';

export default function ProductionLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  return (
    <Stack
      // Les écrans à sélecteur d'espèce suivent l'espèce active en se rechargeant : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf('index', 'fromages', 'controles/liste')}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.production.titre }} />
      <Stack.Screen name="fromages" options={{ title: TEXTES.production.fromages.titre }} />
      <Stack.Screen
        name="fabrication"
        options={{
          title: TEXTES.production.fabrication.titre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen
        name="rappel"
        options={{
          title: TEXTES.production.rappel.titre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="viande" options={{ title: TEXTES.production.viande.titre }} />
      <Stack.Screen name="statistiques" options={{ title: TEXTES.stock.statistiques.titre }} />
      <Stack.Screen
        name="controles/liste"
        options={({ route }) => ({
          title:
            TEXTES.exploitation.controles.familles[
              ((route.params as { famille?: string } | undefined)?.famille ?? 'laitier') as FamilleControle
            ].titre,
        })}
      />
      <Stack.Screen
        name="controles/nouvelle"
        options={{
          title: TEXTES.navigation.layout.nouveauControle,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="controles/groupement" />
      <Stack.Screen name="controles/contenu" />
    </Stack>
  );
}
