import { Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

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
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cheptel"
        options={{
          title: 'Cheptel',
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
          title: 'Comptabilité',
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
          title: 'Exploitation',
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
          title: 'Réglages',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="informations-exploitation"
        options={{ href: null, title: 'Informations de l’exploitation', headerLeft: BoutonRetour }}
      />
    </Tabs>
  );
}
