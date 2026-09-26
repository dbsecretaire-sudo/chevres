import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';
import { ComptabiliteHeaderMenu } from '@/components/ComptabiliteHeaderMenu';

export default function ComptabiliteLayout() {
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
        options={{ title: 'Comptabilité', headerRight: () => <ComptabiliteHeaderMenu /> }}
      />
      <Stack.Screen
        name="nouvelle"
        options={{ title: 'Nouvelle écriture', presentation: 'modal', headerStyle: { backgroundColor: colors.ajout } }}
      />
      <Stack.Screen name="facture/[id]" options={{ title: 'Facture' }} />
      <Stack.Screen name="vente/[id]" options={{ title: 'Vente' }} />
      <Stack.Screen name="fiscalite-impots" options={{ title: 'Impôts (micro-BA)' }} />
      <Stack.Screen name="fiscalite-rsa" options={{ title: 'Déclaration RSA' }} />
    </Stack>
  );
}
