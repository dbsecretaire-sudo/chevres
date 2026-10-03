import { Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EtablissementHeaderButton } from '@/features/etablissements/components/EtablissementHeaderButton';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

function BoutonRetour() {
  return (
    <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingRight: 20 }}>
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </Pressable>
  );
}

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
        name="exploitation"
        options={{
          title: TEXTES.commun.general.exploitation,
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('exploitation', { screen: 'index' });
          },
        })}
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
          headerLeft: BoutonRetour,
        }}
      />
    </Tabs>
  );
}
