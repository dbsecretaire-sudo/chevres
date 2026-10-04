import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { EtablissementHeaderButton } from '@/features/etablissements/components/EtablissementHeaderButton';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export default function TabsLayout() {
  return (
    <Tabs
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
        name="informations-exploitation"
        options={{
          href: null,
          title: TEXTES.commun.general.informationsDeLExploitation,
          // Destination fixe : on revient toujours à l'Accueil, d'où l'écran est ouvert.
          headerLeft: () => <HeaderBackTo to="/" />,
        }}
      />
    </Tabs>
  );
}
