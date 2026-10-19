import { Stack } from 'expo-router';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAccordDesLots } from '@/features/exploitation/hooks/useAccordDesLots';
import { estLieuTiers } from '@/features/accueil/services/lieuxTiers';
import { enteteBureau } from '@/bureau/FlecheRetourBureau';
import { colors } from '@/shared/theme/colors';
import { enteteControle } from '@/features/exploitation/utils/enteteControle';
import type { FamilleControle } from '@/features/exploitation/types';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

/** Vrai quand l'écran s'ouvre pour la charcuterie (paramètre `produit`) plutôt que pour les fromages. */
const charcuterie = (params: object | undefined): boolean =>
  (params as { produit?: string } | undefined)?.produit === PRODUIT_A_LOTS.CHARCUTERIE;

export default function ProductionLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  // Les lots d'accord avec le cheptel et les factures (la viande vendue part des jours d'abattage) dès l'ouverture de la Production.
  useAccordDesLots();
  return (
    <Stack
      // Les écrans à sélecteur d'espèce suivent l'espèce active en se rechargeant : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf(
        'index',
        'fromages',
        'lait',
        'charcuterie',
        'rappels-lots',
        'controles/liste',
      )}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: enteteBureau(),
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.production.titre }} />
      <Stack.Screen name="fromages" options={{ title: TEXTES.production.fromages.titre }} />
      <Stack.Screen name="lait" options={{ title: TEXTES.production.accueil.productionLait.titre }} />
      <Stack.Screen name="laiterie" options={{ title: TEXTES.accueil.ferme.zones.laiterie }} />
      <Stack.Screen
        name="lieu"
        options={({ route }) => {
          const lieu = (route.params as { lieu?: string } | undefined)?.lieu;
          return { title: estLieuTiers(lieu) ? TEXTES.production.lieux[lieu].titre : TEXTES.production.titre };
        }}
      />
      <Stack.Screen name="charcuterie" options={{ title: TEXTES.production.charcuterie.titre }} />
      <Stack.Screen
        name="fabrication"
        options={({ route }) => ({
          title: charcuterie(route.params)
            ? TEXTES.production.fabricationCharcuterie.titre
            : TEXTES.production.fabrication.titre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        })}
      />
      <Stack.Screen
        name="rappel"
        options={({ route }) => ({
          title: charcuterie(route.params)
            ? TEXTES.production.rappelCharcuterie.titre
            : TEXTES.production.rappel.titre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        })}
      />
      <Stack.Screen name="rappels-lots" options={{ title: TEXTES.production.rappelsLots.titre }} />
      <Stack.Screen name="viande" options={{ title: TEXTES.production.viande.titre }} />
      <Stack.Screen name="lot" options={{ title: TEXTES.cheptel.lots.lot }} />
      <Stack.Screen name="oeufs" options={{ title: TEXTES.production.oeufs.titre }} />
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
      <Stack.Screen name="controles/nouvelle" options={({ route }) => enteteControle(route.params)} />
    </Stack>
  );
}
