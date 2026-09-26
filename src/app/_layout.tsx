import { Stack } from 'expo-router';
import { AppSettingsProvider } from '@/context/AppSettingsContext';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AppSettingsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="informations-exploitation"
          options={{
            headerShown: true,
            title: 'Informations de l’exploitation',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
      </Stack>
    </AppSettingsProvider>
  );
}
