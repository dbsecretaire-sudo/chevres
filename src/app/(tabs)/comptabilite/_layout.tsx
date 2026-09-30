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
      <Stack.Screen name="detail" options={{ title: 'Détail' }} />
      <Stack.Screen name="fiscalite-impots" options={{ title: 'Impôts (micro-BA)' }} />
      <Stack.Screen name="fiscalite-rsa" options={{ title: 'Déclaration RSA' }} />
      <Stack.Screen name="fournisseurs/index" options={{ title: 'Fournisseurs' }} />
      <Stack.Screen
        name="fournisseurs/nouveau"
        options={{ title: 'Nouveau fournisseur', presentation: 'modal', headerStyle: { backgroundColor: colors.ajout } }}
      />
      <Stack.Screen name="fournisseurs/[id]" options={{ title: 'Fournisseur' }} />
      <Stack.Screen name="comptes-pcg/index" options={{ title: 'Comptes PCG' }} />
      <Stack.Screen
        name="comptes-pcg/nouveau"
        options={{ title: 'Nouveau compte', presentation: 'modal', headerStyle: { backgroundColor: colors.ajout } }}
      />
      <Stack.Screen name="comptes-pcg/[id]" options={{ title: 'Compte PCG' }} />
      <Stack.Screen name="clients/index" options={{ title: 'Clients' }} />
      <Stack.Screen
        name="clients/nouveau"
        options={{ title: 'Nouveau client', presentation: 'modal', headerStyle: { backgroundColor: colors.ajout } }}
      />
      <Stack.Screen name="clients/[id]" options={{ title: 'Client' }} />
    </Stack>
  );
}
