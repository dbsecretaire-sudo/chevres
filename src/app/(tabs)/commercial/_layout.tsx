import { enteteApplication } from '@/features/accueil/shell/optionsEnTete';
import { Stack } from 'expo-router';
import { enteteBureau } from '@/bureau/FlecheRetourBureau';
import { enteteControle } from '@/features/exploitation/utils/enteteControle';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export default function CommercialLayout() {
  return (
    <Stack
      screenOptions={{
        // Sur le téléphone : le bandeau de la ferme à la place de l'en-tête de navigation.
        ...enteteApplication(),
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: enteteBureau(),
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
      <Stack.Screen name="agritourisme" options={{ title: TEXTES.commercial.accueil.visitesAgri.titre }} />
      <Stack.Screen
        name="visite"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? TEXTES.commercial.agritourisme.visite.titre
            : TEXTES.commercial.agritourisme.visite.titreNouvelle,
        })}
      />
      <Stack.Screen name="visite-simple" options={{ title: TEXTES.accueil.ferme.terrain.tuiles.nouvelleVisite }} />
      <Stack.Screen name="visites-simple" options={{ title: TEXTES.accueil.ferme.terrain.tuiles.visites }} />
      <Stack.Screen name="formules-simple" options={{ title: TEXTES.accueil.ferme.terrain.tuiles.formules }} />
      <Stack.Screen name="accueil-public-simple" options={{ title: TEXTES.accueil.ferme.terrain.tuiles.accueilPublic }} />
      <Stack.Screen name="accueil-public" options={{ title: TEXTES.commercial.agritourisme.accueilPublic.titre }} />
      <Stack.Screen name="formules" options={{ title: TEXTES.commercial.agritourisme.listeFormules.titre }} />
      <Stack.Screen
        name="formule"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? TEXTES.commercial.agritourisme.formule.titre
            : TEXTES.commercial.agritourisme.formule.titreNouvelle,
        })}
      />
      <Stack.Screen
        name="partenaires/liste"
        options={{ title: TEXTES.exploitation.controles.familles.groupement.titre }}
      />
      <Stack.Screen name="partenaires/nouvelle" options={({ route }) => enteteControle(route.params)} />
      <Stack.Screen name="partenaires/groupement" />
      <Stack.Screen name="partenaires/contenu" />
    </Stack>
  );
}
