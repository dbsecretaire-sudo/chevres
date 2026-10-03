import { Stack } from 'expo-router';
import { AppSettingsProvider } from '@/features/settings/context/AppSettingsContext';
import { EtablissementProvider } from '@/features/etablissements/context/EtablissementContext';

export default function RootLayout() {
  return (
    <EtablissementProvider>
      <AppSettingsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AppSettingsProvider>
    </EtablissementProvider>
  );
}
