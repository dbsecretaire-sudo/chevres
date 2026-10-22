import { View } from 'react-native';
import { Stack } from 'expo-router';
import { EcranErreur } from '@/shared/components/EcranErreur';
import { SuperpositionVisite } from '@/features/didacticiel/components/SuperpositionVisite';
import { VisiteGuideeProvider } from '@/features/didacticiel/context/VisiteGuidee';
import { installerAlerteWeb } from '@/shared/utils/alerteWeb';
import { afficheSobre, ID_STYLE_SOBRE } from '@/shared/utils/affichage';
import { AppSettingsProvider } from '@/features/settings/context/AppSettingsContext';
import { EtablissementProvider } from '@/features/etablissements/context/EtablissementContext';

installerAlerteWeb();

// L'affichage sobre : toute la page en nuances de gris (sur le web ; la version Windows l'a déjà fait au chargement).
if (afficheSobre() && typeof document !== 'undefined' && !document.getElementById(ID_STYLE_SOBRE)) {
  const style = document.createElement('style');
  style.id = ID_STYLE_SOBRE;
  style.textContent = 'html { filter: grayscale(1); }';
  document.head.append(style);
}

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
