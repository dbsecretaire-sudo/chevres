import { Stack } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export default function CommercialLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.commercial.titre }} />
      <Stack.Screen name="ventes" options={{ title: TEXTES.commercial.ventes.titre }} />
      <Stack.Screen name="tarifs" options={{ title: TEXTES.commercial.tarifs.titre }} />
      <Stack.Screen name="commandes" options={{ title: TEXTES.commercial.commandes.titre }} />
      <Stack.Screen
        name="commande"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? TEXTES.commercial.commandes.titre
            : TEXTES.commercial.commande.titreNouvelle,
        })}
      />
      <Stack.Screen name="circuits" options={{ title: TEXTES.commercial.circuits.titre }} />
      <Stack.Screen name="agritourisme" options={{ title: TEXTES.commercial.agritourisme.titre }} />
      <Stack.Screen
        name="visite"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? TEXTES.commercial.agritourisme.visite.titre
            : TEXTES.commercial.agritourisme.visite.titreNouvelle,
        })}
      />
      <Stack.Screen name="formules" options={{ title: TEXTES.commercial.agritourisme.listeFormules.titre }} />
      <Stack.Screen
        name="formule"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? TEXTES.commercial.agritourisme.formule.titre
            : TEXTES.commercial.agritourisme.formule.titreNouvelle,
        })}
      />
    </Stack>
  );
}
