import { Tabs, useSegments } from 'expo-router';
import { quitterRetour, useRetourContexte } from '@/shared/navigation/contexteRetour';
import { useBarreAjoutBleue } from '@/shared/navigation/barreAjout';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderBackTo } from '@/shared/components/HeaderBackTo';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { productionActive } from '@/features/comptabilite/utils/recettes';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { EtablissementHeaderButton } from '@/features/etablissements/components/EtablissementHeaderButton';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { MenuBureau } from '@/bureau/MenuBureau';
import { EnDeuxColonnes } from '@/bureau/EnDeuxColonnes';
import { estBureau } from '@/shared/utils/plateforme';

/** Les pages (cachées de la barre) qui font partie de l'Organisation : son onglet y reste en couleur. */
const PAGES_ORGANISATION = [
  'reglages',
  'organisation-',
  'export-donnees',
  'pdf-donnees',
  'sauvegarde-locale',
  'google-drive',
  'structure-dossiers',
  'informations-exploitation',
  'documents-identification',
  'document-identification',
];

function Onglets() {
  const segments: string[] = useSegments();
  const page = segments[1] ?? '';
  const retourContexte = useRetourContexte();
  // Pendant un ajout, la barre est bleue : les onglets gardent alors les couleurs de la barre, pas celles de leur page.
  const barreBleue = useBarreAjoutBleue();
  // Les écrans de santé font partie du cheptel : son onglet y reste en couleur.
  const dansSante = page === 'sante' && !barreBleue;
  // Un écran de la comptabilité ouvert depuis l'Organisation : c'est l'onglet Organisation qui reste en couleur.
  const depuisOrganisation = retourContexte !== null && page !== 'sante' && !barreBleue;
  const dansOrganisation =
    !barreBleue && (depuisOrganisation || PAGES_ORGANISATION.some((p) => page.startsWith(p)));
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  const { espece } = useEtablissement();
  // Une entreprise a un onglet Clients à la place du Cheptel ; un élevage l'inverse.
  const entreprise = modeEntreprise();
  // Le stock : un onglet en bas pour une exploitation agricole (fromagerie, aliments) et pour un gîte (boissons, nourriture).
  const stockGite = entreprise && activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);
  return (
    <Tabs
      // La flèche (ou le retour du téléphone) ramène à l'onglet d'où l'on vient, pas toujours à l'accueil.
      backBehavior="history"
      screenListeners={{ tabPress: () => quitterRetour() }}
      screenLayout={ecranParEspeceSauf(
        'cheptel',
        'sante',
        'production',
        'commercial',
        'comptabilite',
        'index',
      )}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        // Dans la version Windows, les menus de la barre du haut remplacent la barre d'icônes du bas.
        tabBarStyle: estBureau() ? { display: 'none' } : undefined,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="paw"
              size={size}
              color={
                dansSante ? colors.primary : barreBleue && page === 'sante' ? colors.ajoutIconActif : color
              }
            />
          ),
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
          // Un gîte : le logo de ses activités annexes ; un secrétariat : le dossier.
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={stockGite ? 'storefront' : 'folder-open'}
              size={size}
              color={depuisOrganisation ? colors.textMuted : color}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('clients', { screen: 'index' });
          },
        })}
      />
      {/* La production d'un élevage : fromages, viande vendue, contrôle laitier, groupements (le stock y est branché). */}
      <Tabs.Screen
        name="production"
        options={{
          title: TEXTES.production.titre,
          headerShown: false,
          // Les animaux de compagnie n'ont aucune production.
          href: entreprise || !productionActive(espece) ? null : undefined,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cheese" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('production', { screen: 'index' });
          },
        })}
      />
      {/* Le volet commercial d'un élevage : ventes et clients, tarifs, commandes et livraisons, circuits de vente. */}
      <Tabs.Screen
        name="commercial"
        options={{
          title: TEXTES.commercial.titre,
          headerShown: false,
          href: entreprise ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('commercial', { screen: 'index' });
          },
        })}
      />
      {/* La santé (alimentation, visites, contrôles) s'ouvre depuis l'en-tête du Cheptel : l'onglet du Cheptel y reste en couleur. */}
      <Tabs.Screen name="sante" options={{ href: null, headerShown: false }} />
      <Tabs.Screen
        name="comptabilite"
        options={{
          title: TEXTES.commun.general.comptabilite,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={depuisOrganisation ? colors.textMuted : color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('comptabilite', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="reglages"
        options={{
          title: TEXTES.navigation.layout.reglages,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="sitemap-outline"
              size={size}
              color={dansOrganisation ? colors.primary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="didacticiel"
        options={{
          href: null,
          title: TEXTES.didacticiel.titre,
          // Destination fixe : on revient toujours à l'Accueil, d'où l'écran est ouvert.
          headerLeft: () => <HeaderBackTo to="/" />,
        }}
      />
      <Tabs.Screen
        name="rappels-historique"
        options={{
          href: null,
          title: TEXTES.rappels.historique.titre,
          // Destination fixe : on revient toujours à l'Accueil, d'où l'écran est ouvert.
          headerLeft: () => <HeaderBackTo to="/" />,
        }}
      />
      {/* Les pages de l'organisation : une par rubrique, puis les écrans de chaque rubrique (la flèche remonte d'un niveau). */}
      {[
        ['organisation-etablissement', TEXTES.settings.reglages.sectionEtablissement, ROUTES.REGLAGES],
        ['organisation-tiers', TEXTES.settings.reglages.sectionTiers, ROUTES.REGLAGES],
        [
          'organisation-categories-client',
          TEXTES.settings.reglages.sectionCategoriesClient,
          ROUTES.ORGANISATION_TIERS,
        ],
        [
          'organisation-categories-tiers',
          TEXTES.settings.reglages.sectionCategoriesTiers,
          ROUTES.ORGANISATION_TIERS,
        ],
        ['organisation-donnees', TEXTES.settings.reglages.sectionDonnees, ROUTES.REGLAGES],
        ['organisation-regles', TEXTES.settings.reglages.sectionRegles, ROUTES.REGLAGES],
        ['export-donnees', TEXTES.settings.reglages.export, ROUTES.ORGANISATION_DONNEES],
        ['pdf-donnees', TEXTES.settings.reglages.pdf, ROUTES.ORGANISATION_DONNEES],
        ['sauvegarde-locale', TEXTES.settings.reglages.sauvegardeLocale, ROUTES.ORGANISATION_DONNEES],
        ['google-drive', TEXTES.settings.reglages.googleDrive, ROUTES.ORGANISATION_DONNEES],
      ].map(([name, title, retour]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            href: null,
            title,
            headerLeft: () => <HeaderBackTo to={retour} />,
          }}
        />
      ))}
      <Tabs.Screen
        name="structure-dossiers"
        options={{
          href: null,
          title: TEXTES.dossiers.structure.titre,
          // Destination fixe : on revient toujours aux Réglages, d'où l'écran est ouvert.
          headerLeft: () => <HeaderBackTo to={ROUTES.ORGANISATION_ETABLISSEMENT} />,
        }}
      />
      <Tabs.Screen
        name="documents-identification"
        options={{
          href: null,
          title: TEXTES.identification.titre,
          // On revient toujours à Mon établissement, d'où la liste est ouverte.
          headerLeft: () => <HeaderBackTo to={ROUTES.ORGANISATION_ETABLISSEMENT} />,
        }}
      />
      <Tabs.Screen
        name="document-identification"
        options={{
          href: null,
          title: TEXTES.identification.titre,
          // Un document revient à la liste des documents d'identification.
          headerLeft: () => <HeaderBackTo to={ROUTES.DOCUMENTS_IDENTIFICATION} />,
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

/** Dans la version Windows : la barre de menus en haut, et deux colonnes (menu de la rubrique à gauche, écran à droite) quand la fenêtre est large. */
export default function TabsLayout() {
  return (
    <>
      <MenuBureau />
      <EnDeuxColonnes>
        <Onglets />
      </EnDeuxColonnes>
    </>
  );
}
