import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';
import { CheptelHeaderMenu } from '@/components/CheptelHeaderMenu';
import { HeaderBackTo } from '@/components/HeaderBackTo';

export default function CheptelLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Cheptel', headerRight: () => <CheptelHeaderMenu /> }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Fiche chèvre' }} />
      <Stack.Screen
        name="nouvelle"
        options={{
          title: 'Nouvelle chèvre',
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
          headerLeft: () => <HeaderBackTo to="/cheptel" />,
        }}
      />
      <Stack.Screen
        name="naissance-nouvelle"
        options={{ title: 'Déclarer une naissance', presentation: 'modal', headerStyle: { backgroundColor: colors.ajout } }}
      />
      <Stack.Screen
        name="ajout-rapide"
        options={{ title: 'Ajout rapide', presentation: 'modal', headerStyle: { backgroundColor: colors.ajout } }}
      />
      <Stack.Screen name="naissances" options={{ title: 'Naissances' }} />
      <Stack.Screen name="historique" options={{ title: 'Historique (mortes, abattoir, vendues)' }} />
      <Stack.Screen name="bilan" options={{ title: 'Bilan annuel' }} />
    </Stack>
  );
}
