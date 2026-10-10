import { Stack, type Href } from 'expo-router';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { quitterRetour, useRetourContexte } from '@/shared/navigation/contexteRetour';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import { enteteControle } from '@/features/exploitation/utils/enteteControle';
import type { FamilleControle } from '@/features/exploitation/types';
import { TEXTES } from '@/shared/textes';

export default function SanteLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  const retourContexte = useRetourContexte();
  /** Ouvert depuis l'en-tête du Cheptel : la flèche y ramène. */
  const flecheCheptel = retourContexte
    ? () => <HeaderBackTo to={retourContexte as Href} onBack={quitterRetour} />
    : undefined;
  return (
    <Stack
      // Les écrans à sélecteur d'espèce suivent l'espèce active en se rechargeant : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf('alimentation', 'veterinaire/index', 'controles/liste')}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="alimentation"
        options={{ title: TEXTES.commun.general.alimentation, headerLeft: flecheCheptel }}
      />
      <Stack.Screen
        name="veterinaire/index"
        options={{ title: TEXTES.commun.general.visitesVeterinaire, headerLeft: flecheCheptel }}
      />
      <Stack.Screen
        name="veterinaire/nouvelle"
        options={{
          title: TEXTES.navigation.layout.nouvelleVisite,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen
        name="controles/liste"
        options={({ route }) => ({
          headerLeft: flecheCheptel,
          title:
            TEXTES.exploitation.controles.familles[
              ((route.params as { famille?: string } | undefined)?.famille ?? 'animaux') as FamilleControle
            ].titre,
        })}
      />
      <Stack.Screen name="controles/nouvelle" options={({ route }) => enteteControle(route.params)} />
    </Stack>
  );
}
