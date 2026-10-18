import { View } from 'react-native';
import { Stack } from 'expo-router';
import { EcranErreur } from '@/shared/components/EcranErreur';
import { SuperpositionVisite } from '@/features/didacticiel/components/SuperpositionVisite';
import { VisiteGuideeProvider } from '@/features/didacticiel/context/VisiteGuidee';
import { installerAlerteWeb } from '@/shared/utils/alerteWeb';
import { AppSettingsProvider } from '@/features/settings/context/AppSettingsContext';
import { EtablissementProvider } from '@/features/etablissements/context/EtablissementContext';

installerAlerteWeb();

/** Un écran qui plante montre son erreur (à recopier) au lieu d'une page blanche. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <EcranErreur error={error} retry={retry} />;
}

export default function RootLayout() {
  return (
    <EtablissementProvider>
      <AppSettingsProvider>
        <VisiteGuideeProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
            {/* La visite guidée : par-dessus toutes les pages. */}
            <SuperpositionVisite />
          </View>
        </VisiteGuideeProvider>
      </AppSettingsProvider>
    </EtablissementProvider>
  );
}
