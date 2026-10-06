import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { EtablissementHeaderButton } from '@/features/etablissements/components/EtablissementHeaderButton';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export default function TabsLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  // Une entreprise a un onglet Clients à la place du Cheptel ; un élevage l'inverse.
  const entreprise = modeEntreprise();
  // Le stock : un onglet en bas pour une exploitation agricole (fromagerie, aliments) et pour un gîte (boissons, nourriture).
  const stockGite = entreprise && activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);
  return (
    <Tabs
      screenLayout={ecranParEspeceSauf('cheptel', 'comptabilite', 'index')}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: TEXTES.navigation.layout.accueil,
          headerRight: () => <EtablissementHeaderButton />,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cheptel"
        options={{
          title: TEXTES.commun.general.cheptel,
          headerShown: false,
          href: entreprise ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="paw" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('cheptel', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: TEXTES.commun.general.clients,
          headerShown: false,
          href: entreprise ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('clients', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="comptabilite"
        options={{
          title: TEXTES.commun.general.comptabilite,
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('comptabilite', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: TEXTES.stock.titre,
          href: !entreprise || stockGite ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rh"
        options={{
          title: TEXTES.rh.ressourcesHumaines.titre,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reglages"
        options={{
          title: TEXTES.navigation.layout.reglages,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          href: null,
          title: TEXTES.commun.general.balance,
          // Destination fixe : on revient toujours à l'Accueil, d'où l'écran est ouvert.
          headerLeft: () => <HeaderBackTo to="/" />,
        }}
      />
      <Tabs.Screen
        name="structure-dossiers"
        options={{
          href: null,
          title: TEXTES.dossiers.structure.titre,
          // Destination fixe : on revient toujours aux Réglages, d'où l'écran est ouvert.
          headerLeft: () => <HeaderBackTo to={ROUTES.REGLAGES} />,
        }}
      />
      <Tabs.Screen
        name="informations-exploitation"
        options={{
          href: null,
          title: entreprise
            ? TEXTES.commun.general.informationsDeLEntreprise
            : TEXTES.commun.general.informationsDeLExploitation,
          // Destination fixe : on revient toujours à l'Accueil, d'où l'écran est ouvert.
          headerLeft: () => <HeaderBackTo to="/" />,
        }}
      />
    </Tabs>
  );
}
