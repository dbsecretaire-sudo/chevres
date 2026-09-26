import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function FournisseursLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Fournisseurs' }} />
      <Stack.Screen
        name="nouveau"
        options={{ title: 'Nouveau fournisseur', presentation: 'modal', headerStyle: { backgroundColor: colors.ajout } }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Fournisseur' }} />
    </Stack>
  );
}
