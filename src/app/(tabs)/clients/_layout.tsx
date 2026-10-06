import { Stack } from 'expo-router';
import { MenuActivite } from '@/features/dossiers/components/MenuActivite';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * Onglet Activité d'une entreprise : l'explorateur de dossiers (avec le menu burger vers la liste des clients),
 * la fiche et la liste des clients, le dossier d'un client, ses sous-dossiers et leurs contenus.
 */
export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: TEXTES.dossiers.explorateur.titre, headerRight: () => <MenuActivite /> }}
      />
      <Stack.Screen name="liste" options={{ title: TEXTES.commun.general.clients }} />
      <Stack.Screen
        name="nouveau"
        options={{
          title: TEXTES.commun.general.nouveauClient,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="[id]" options={{ title: TEXTES.commun.general.client }} />
      <Stack.Screen name="dossiers/[id]" options={{ title: '' }} />
      <Stack.Screen name="sous-dossier/[id]" options={{ title: '' }} />
      <Stack.Screen
        name="element/nouveau"
        options={{
          title: TEXTES.dossiers.element.nouveau,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="element/[id]" options={{ title: '' }} />
      <Stack.Screen name="echeances/[date]" options={{ title: '' }} />
      <Stack.Screen name="bar" options={{ title: TEXTES.bar.titre }} />
      <Stack.Screen name="repas/[date]" options={{ title: '' }} />
      <Stack.Screen name="journal" options={{ title: TEXTES.trading.journal.titre }} />
      <Stack.Screen
        name="trade/nouveau"
        options={{
          title: TEXTES.trading.trade.nouveau,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="trade/[id]" options={{ title: TEXTES.trading.trade.modifier }} />
      <Stack.Screen name="dossiers-clients" options={{ title: TEXTES.gite.activites.dossiersClients }} />
      <Stack.Screen name="gite/index" options={{ title: TEXTES.gite.calendrier.titre }} />
      <Stack.Screen name="gite/jour/[date]" options={{ title: '' }} />
      <Stack.Screen
        name="gite/sejour/nouveau"
        options={{
          title: TEXTES.gite.sejour.nouveau,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="gite/sejour/[id]" options={{ title: TEXTES.gite.sejour.modifier }} />
    </Stack>
  );
}
