import { Stack } from 'expo-router';
import { installerAlerteWeb } from '@/shared/utils/alerteWeb';
import { AppSettingsProvider } from '@/features/settings/context/AppSettingsContext';
import { EtablissementProvider } from '@/features/etablissements/context/EtablissementContext';

installerAlerteWeb();

export default function RootLayout() {
  return (
    <EtablissementProvider>
      <AppSettingsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AppSettingsProvider>
    </EtablissementProvider>
  );
}
