import { enteteApplication } from '@/shared/navigation/enteteApplication';
import { Stack } from 'expo-router';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useAccordDesLots } from '@/features/exploitation/hooks/useAccordDesLots';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { enteteBureau } from '@/bureau/FlecheRetourBureau';
import { colors } from '@/shared/theme/colors';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export default function CheptelLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  // Les lots d'accord avec le cheptel (un animal d'un lot d'abattoir est abattu) dès l'ouverture du Cheptel.
  useAccordDesLots();
  return (
    <Stack
      // Les écrans à sélecteur d'espèce suivent l'espèce active en se rechargeant : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf('index', 'liste', 'bilan', 'historique', 'naissances', 'reglages', 'bibliotheque')}
      screenOptions={{
        // Sur le téléphone : le bandeau de la ferme à la place de l'en-tête de navigation.
        ...enteteApplication(),
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: enteteBureau(),
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.commun.general.cheptel }} />
      <Stack.Screen name="liste" options={{ title: TEXTES.cheptel.listeCheptel.titre }} />
      <Stack.Screen name="bibliotheque" options={{ title: TEXTES.export.bibliotheque.titre }} />
      <Stack.Screen name="documents-circulation" options={{ title: TEXTES.cheptel.circulation.titreEcran }} />
      <Stack.Screen name="dossier-pac" options={{ title: TEXTES.cheptel.accueil.lignes.dossierPac.titre }} />
      <Stack.Screen name="[id]" options={{ title: TEXTES.navigation.layout.ficheChevre }} />
      <Stack.Screen
        name="nouvelle"
        options={{
          title: TEXTES.navigation.layout.nouvelleChevre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
          headerLeft: () => <HeaderBackTo to={ROUTES.CHEPTEL_LISTE} />,
        }}
      />
      <Stack.Screen
        name="naissance-nouvelle"
        options={{
          title: TEXTES.navigation.layout.declarerUneNaissance,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen
        name="ajout-rapide"
        options={{
          title: TEXTES.navigation.layout.ajoutRapide,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="naissances" options={{ title: TEXTES.navigation.layout.naissances }} />
      <Stack.Screen
        name="historique"
        options={{ title: TEXTES.navigation.layout.historiqueMortesAbattoirVendues }}
      />
      <Stack.Screen name="bilan" options={{ title: TEXTES.commun.general.bilanAnnuel }} />
      <Stack.Screen name="traitements" options={{ title: TEXTES.cheptel.traitements.titre }} />
      <Stack.Screen name="tableau-de-bord" options={{ title: TEXTES.cheptel.tableauDeBord.titre }} />
      <Stack.Screen name="traitement" options={{ title: TEXTES.cheptel.traitements.modifier }} />
      <Stack.Screen name="lots" options={{ title: TEXTES.cheptel.lots.titre }} />
      <Stack.Screen name="lots-categories" options={{ title: TEXTES.cheptel.lots.categories.gererTitre }} />
      <Stack.Screen name="lots-categorie" options={{ title: TEXTES.cheptel.lots.titre }} />
      <Stack.Screen name="lot" options={{ title: TEXTES.cheptel.lots.lot }} />
      <Stack.Screen name="reglages" options={{ title: TEXTES.cheptel.reglages.titre }} />
    </Stack>
  );
}
