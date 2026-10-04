import { Stack } from 'expo-router';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import { ComptabiliteHeaderMenu } from '@/features/comptabilite/components/ComptabiliteHeaderMenu';
import { plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';

export default function ComptabiliteLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  return (
    <Stack
      // La liste, le Détail et la fiscalité suivent l'espèce active par un simple filtre : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf('index', 'detail', 'fiscalite-impots', 'fiscalite-rsa', 'tva')}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: plusieursEspeces()
            ? TEXTES.comptabilite.parActivite.parActivite
            : TEXTES.commun.general.comptabilite,
          headerRight: () => <ComptabiliteHeaderMenu />,
        }}
      />
      <Stack.Screen
        name="nouvelle"
        options={{
          title: TEXTES.navigation.layout.nouvelleEcriture,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="facture/[id]" options={{ title: TEXTES.commun.general.facture }} />
      <Stack.Screen name="vente/[id]" options={{ title: TEXTES.commun.general.vente }} />
      <Stack.Screen name="detail" options={{ title: TEXTES.commun.general.detail }} />
      <Stack.Screen
        name="fiscalite-impots"
        options={{
          title: modeEntreprise() ? TEXTES.entreprise.menu.impots : TEXTES.commun.general.impotsMicroBa,
        }}
      />
      <Stack.Screen
        name="fiscalite-rsa"
        options={{
          title: modeEntreprise()
            ? TEXTES.entreprise.menu.chiffreAffaires
            : TEXTES.commun.general.declarationRsa,
        }}
      />
      <Stack.Screen name="tva" options={{ title: TEXTES.entreprise.menu.tva }} />
      <Stack.Screen name="fournisseurs/index" options={{ title: TEXTES.commun.general.fournisseurs }} />
      <Stack.Screen
        name="fournisseurs/nouveau"
        options={{
          title: TEXTES.commun.general.nouveauFournisseur,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="fournisseurs/[id]" options={{ title: TEXTES.commun.general.fournisseur }} />
      <Stack.Screen name="comptes-pcg/index" options={{ title: TEXTES.commun.general.comptesPcg }} />
      <Stack.Screen
        name="comptes-pcg/nouveau"
        options={{
          title: TEXTES.commun.general.nouveauCompte,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="comptes-pcg/[id]" options={{ title: TEXTES.commun.general.comptePcg }} />
      <Stack.Screen name="clients/index" options={{ title: TEXTES.commun.general.clients }} />
      <Stack.Screen
        name="clients/nouveau"
        options={{
          title: TEXTES.commun.general.nouveauClient,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="clients/[id]" options={{ title: TEXTES.commun.general.client }} />
    </Stack>
  );
}
