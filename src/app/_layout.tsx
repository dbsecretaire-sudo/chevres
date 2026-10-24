import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StyleComptable } from '@/shared/components/StyleComptable';
import { EcranErreur } from '@/shared/components/EcranErreur';
import { SuperpositionVisite } from '@/features/didacticiel/components/SuperpositionVisite';
import { VisiteGuideeProvider } from '@/features/didacticiel/context/VisiteGuidee';
import { installerAlerteWeb } from '@/shared/utils/alerteWeb';
import { afficheSobre, ID_STYLE_SOBRE } from '@/shared/utils/affichage';
import { appliquerTailleTexte, lireTailleTexte } from '@/shared/utils/tailleTexte';
import { AppSettingsProvider } from '@/features/settings/context/AppSettingsContext';
import { EtablissementProvider } from '@/features/etablissements/context/EtablissementContext';
import { PorteDuRole } from '@/features/roles/components/PorteDuRole';
import { RoleProvider, useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';

installerAlerteWeb();

// L'affichage sobre : toute la page en nuances de gris (sur le web ; la version Windows l'a déjà fait au chargement).
if (afficheSobre() && typeof document !== 'undefined' && !document.getElementById(ID_STYLE_SOBRE)) {
  const style = document.createElement('style');
  style.id = ID_STYLE_SOBRE;
  style.textContent = 'html { filter: grayscale(1); }';
  document.head.append(style);
}

// La taille du texte choisie (la version Windows l'applique déjà à l'ouverture ; un navigateur la reprend ici).
if (afficheSobre() && typeof window !== 'undefined' && !window.bureau) appliquerTailleTexte(lireTailleTexte());

/** Un écran qui plante montre son erreur (à recopier) au lieu d'une page blanche. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <EcranErreur error={error} retry={retry} />;
}

export default function RootLayout() {
  return (
    <RoleProvider>
      <PorteDuRole>
        <Application />
      </PorteDuRole>
    </RoleProvider>
  );
}

/** L'application elle-même, une fois le rôle choisi : le mode avancé s'ouvre sur l'accueil de la ferme, le mode normal sur sa page de gros boutons (« /berger »). */
function Application() {
  const { role } = useRole();
  const berger = role === ROLE.BERGER;
  return (
    <EtablissementProvider sansSelecteur={berger}>
      <AppSettingsProvider>
        <VisiteGuideeProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
            {/* La visite guidée : par-dessus toutes les pages. */}
            {afficheSobre() || berger ? null : <SuperpositionVisite />}
            {/* L'affichage sobre en grande fenêtre : le style d'un poste de comptabilité. */}
            <StyleComptable />
          </View>
        </VisiteGuideeProvider>
      </AppSettingsProvider>
    </EtablissementProvider>
  );
}
