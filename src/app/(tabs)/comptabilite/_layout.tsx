import { enteteApplication } from '@/shared/navigation/enteteApplication';
import { Stack, type Href } from 'expo-router';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { quitterRetour, useRetourContexte } from '@/shared/navigation/contexteRetour';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { enteteBureau } from '@/bureau/FlecheRetourBureau';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export default function ComptabiliteLayout() {
  const retourOrganisation = useRetourContexte();
  /** La flèche d'un écran ouvert depuis l'Organisation : elle y ramène. */
  const flecheOrganisation = retourOrganisation
    ? () => <HeaderBackTo to={retourOrganisation as Href} onBack={quitterRetour} />
    : undefined;
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  return (
    <Stack
      // La liste, le Détail et la fiscalité suivent l'espèce active par un simple filtre : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf(
        'index',
        'liste',
        'detail',
        'fiscalite',
        'fiscalite-impots',
        'fiscalite-rsa',
        'urssaf',
        'tva',
        'rentabilite',
        'tresorerie',
      )}
      screenOptions={{
        // Sur le téléphone : le bandeau de la ferme à la place de l'en-tête de navigation.
        ...enteteApplication(),
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: enteteBureau(),
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.commun.general.comptabilite }} />
      <Stack.Screen name="liste" options={{ title: TEXTES.comptabilite.accueil.ecritures }} />
      <Stack.Screen name="inventaire" options={{ title: TEXTES.comptabilite.accueil.inventaire.titre }} />
      <Stack.Screen name="stocks" options={{ title: TEXTES.comptabilite.accueil.inventaire.stocks }} />
      <Stack.Screen name="stock-historique" options={{ title: TEXTES.stock.historique.titre }} />
      <Stack.Screen name="stock-statistiques" options={{ title: TEXTES.stock.statistiques.titre }} />
      <Stack.Screen name="stock-structure" options={{ title: TEXTES.stock.structure.titre }} />
      <Stack.Screen name="conditionnement" options={{ title: TEXTES.stock.conditionnement.titre }} />
      <Stack.Screen name="reglages" options={{ title: TEXTES.comptabilite.accueil.reglages.titre }} />
      <Stack.Screen name="taux" options={{ title: TEXTES.comptabilite.tauxParProduit.titre }} />
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
      <Stack.Screen name="lot" options={{ title: TEXTES.cheptel.lots.lot }} />
      <Stack.Screen name="detail" options={{ title: TEXTES.commun.general.detail }} />
      <Stack.Screen name="fiscalite" options={{ title: TEXTES.comptabilite.fiscalite.titre }} />
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
      <Stack.Screen name="urssaf" options={{ title: TEXTES.entreprise.menu.urssaf }} />
      <Stack.Screen name="tresorerie" options={{ title: TEXTES.comptabilite.accueil.tresorerie.titre }} />
      <Stack.Screen
        name="tresorerie-reglages"
        options={{ title: TEXTES.comptabilite.tresorerie.reglagesEcran.soldeTitre }}
      />
      <Stack.Screen name="rentabilite" options={{ title: TEXTES.comptabilite.accueil.rentabilite.titre }} />
      <Stack.Screen name="tva" options={{ title: TEXTES.comptabilite.accueil.tva.titre }} />
      <Stack.Screen
        name="contacts/index"
        options={{ title: TEXTES.contacts.titre, headerLeft: flecheOrganisation ?? enteteBureau() }}
      />
      <Stack.Screen
        name="contacts/nouveau"
        options={{
          title: TEXTES.contacts.nouveau,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="contacts/[id]" options={{ title: TEXTES.contacts.titreFiche }} />
      <Stack.Screen name="contacts/contenu" options={{ title: TEXTES.contacts.titreDocument }} />
      <Stack.Screen name="contacts/contrat" options={{ title: TEXTES.contacts.contrat.titre }} />
      <Stack.Screen name="contacts/dossier" options={{ title: TEXTES.contacts.titreFiche }} />
      <Stack.Screen
        name="fournisseurs/index"
        options={{
          title: TEXTES.commun.general.fournisseurs,
          headerLeft: flecheOrganisation ?? enteteBureau(),
        }}
      />
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
      <Stack.Screen name="plan-comptable" options={{ title: TEXTES.comptesPcg.planGeneral.titre }} />
      <Stack.Screen
        name="comptes-pcg/nouveau"
        options={{
          title: TEXTES.commun.general.nouveauCompte,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        }}
      />
      <Stack.Screen name="comptes-pcg/[id]" options={{ title: TEXTES.commun.general.comptePcg }} />
      <Stack.Screen
        name="clients/index"
        options={{ title: TEXTES.commun.general.clients, headerLeft: flecheOrganisation ?? enteteBureau() }}
      />
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
