import { Stack, type Href } from 'expo-router';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { quitterRetour, useRetourContexte } from '@/shared/navigation/contexteRetour';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { enteteBureau } from '@/bureau/FlecheRetourBureau';
import { colors } from '@/shared/theme/colors';
import { enteteControle } from '@/features/exploitation/utils/enteteControle';
import type { FamilleControle } from '@/features/exploitation/types';
import { TEXTES } from '@/shared/textes';

/** Le titre d'un écran de contrôles : celui de l'entrée du menu quand un écran précis est demandé (visites, boucles, contrôles des animaux), sinon celui du volet. */
function titreDeLEcran(params: { famille?: string; onglet?: string } | undefined): string {
  const lignes = TEXTES.cheptel.accueil.lignes;
  if (params?.onglet === 'sante') return lignes.visites.titre;
  if (params?.onglet === 'boucles') return lignes.boucles.titre;
  if (params?.onglet === 'animaux') return lignes.controles.titre;
  return TEXTES.exploitation.controles.familles[(params?.famille ?? 'animaux') as FamilleControle].titre;
}

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
      screenLayout={ecranParEspeceSauf('alimentation', 'controles/liste')}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: enteteBureau(),
      }}
    >
      <Stack.Screen
        name="alimentation"
        options={{ title: TEXTES.commun.general.alimentation, headerLeft: flecheCheptel }}
      />
      <Stack.Screen
        name="veterinaire/visite"
        options={{ title: TEXTES.exploitation.nouvelleVisite.titreFiche }}
      />
      <Stack.Screen
        name="controles/liste"
        options={({ route }) => ({
          headerLeft: flecheCheptel,
          title: titreDeLEcran(route.params as { famille?: string; onglet?: string } | undefined),
        })}
      />
      <Stack.Screen name="controles/nouvelle" options={({ route }) => enteteControle(route.params)} />
    </Stack>
  );
}
