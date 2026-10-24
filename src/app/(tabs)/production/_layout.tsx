import { enteteApplication } from '@/features/accueil/shell/optionsEnTete';
import { Stack } from 'expo-router';
import { ecranParEspeceSauf } from '@/features/etablissements/components/EcranParEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAccordDesLots } from '@/features/lots-animaux/hooks/useAccordDesLots';
import { estLieuTiers } from '@/features/accueil/services/lieuxTiers';
import { enteteBureau } from '@/bureau/FlecheRetourBureau';
import { enteteDuBatiment } from '@/shared/components/EnteteBatiment';
import { colors } from '@/shared/theme/colors';
import { enteteControle } from '@/features/exploitation/utils/enteteControle';
import type { FamilleControle } from '@/features/exploitation/types';
import { produitAnalyse } from '@/features/analyses/services/analysesProduits';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

/** Vrai quand l'écran s'ouvre pour un plat préparé (paramètre `produit`). */
const plat = (params: object | undefined): boolean =>
  (params as { produit?: string } | undefined)?.produit === PRODUIT_A_LOTS.PLAT;

/** Vrai quand l'écran s'ouvre pour un savon (paramètre `produit`). */
const savon = (params: object | undefined): boolean =>
  (params as { produit?: string } | undefined)?.produit === PRODUIT_A_LOTS.SAVON;

/** Vrai quand l'écran s'ouvre pour la charcuterie (paramètre `produit`) plutôt que pour les fromages. */
const charcuterie = (params: object | undefined): boolean =>
  (params as { produit?: string } | undefined)?.produit === PRODUIT_A_LOTS.CHARCUTERIE;

export default function ProductionLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  // Les lots d'accord avec le cheptel et les factures (la viande vendue part des jours d'abattage) dès l'ouverture de la Production.
  useAccordDesLots();
  return (
    <Stack
      // Les écrans à sélecteur d'espèce suivent l'espèce active en se rechargeant : ils ne sont pas recréés.
      screenLayout={ecranParEspeceSauf(
        'index',
        'fromages',
        'lait',
        'charcuterie',
        'plats',
        'savons',
        'rappels-lots',
        'controles/liste',
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
      <Stack.Screen name="index" options={{ title: TEXTES.production.titre }} />
      <Stack.Screen
        name="fromages"
        options={{ title: TEXTES.production.fromages.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen
        name="plats"
        options={{ title: TEXTES.production.plats.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen
        name="savons"
        options={{ title: TEXTES.production.savons.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen name="savon-dossier" options={{ title: TEXTES.production.savons.dossier.titre }} />
      <Stack.Screen
        name="lots"
        options={{ title: TEXTES.production.lots.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen
        name="lait"
        options={{ title: TEXTES.production.accueil.productionLait.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen
        name="laiterie"
        options={{ title: TEXTES.production.laiterie.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen
        name="lieu"
        options={({ route }) => {
          const lieu = (route.params as { lieu?: string } | undefined)?.lieu;
          return {
            title: estLieuTiers(lieu)
              ? TEXTES.production.lieux[lieu].titre
              : lieu === 'grange'
                ? TEXTES.production.lieux.entrepot.grange
                : lieu === 'fromagerie'
                  ? TEXTES.production.lieux.fromagerie.titre
                  : lieu === 'animaux'
                    ? TEXTES.production.lieux.cheptel.titre
                    : lieu === 'boucles'
                      ? TEXTES.production.lieux.documents.liens.boucles.titre
                      : TEXTES.production.titre,
            headerLeft: enteteDuBatiment(),
            // La grange et le stock de l'atelier ont la capsule de la ferme à la place de l'en-tête ; la page des boucles a son en-tête.
            headerShown: lieu !== 'grange',
          };
        }}
      />
      <Stack.Screen
        name="charcuterie"
        options={{ title: TEXTES.production.charcuterie.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen
        name="fabrication"
        options={({ route }) => ({
          title: plat(route.params)
            ? TEXTES.production.fabricationPlat.titre
            : savon(route.params)
              ? TEXTES.production.fabricationSavon.titre
              : charcuterie(route.params)
              ? TEXTES.production.fabricationCharcuterie.titre
              : TEXTES.production.fabrication.titre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        })}
      />
      <Stack.Screen
        name="rappel"
        options={({ route }) => ({
          title: plat(route.params)
            ? TEXTES.production.rappelPlat.titre
            : savon(route.params)
              ? TEXTES.production.rappelSavon.titre
              : charcuterie(route.params)
              ? TEXTES.production.rappelCharcuterie.titre
              : TEXTES.production.rappel.titre,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.ajout },
        })}
      />
      <Stack.Screen name="rappels-lots" options={{ title: TEXTES.production.rappelsLots.titre }} />
      <Stack.Screen
        name="viande"
        options={{ title: TEXTES.production.viande.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen name="lot" options={{ title: TEXTES.cheptel.lots.lot }} />
      <Stack.Screen
        name="analyses-produit"
        options={({ route }) => ({
          title: TEXTES.analysesProduits.produits[produitAnalyse((route.params as { produit?: string } | undefined)?.produit)].titre,
        })}
      />
      <Stack.Screen
        name="recettes"
        options={{ title: TEXTES.production.recettes.page.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen name="recette" options={{ title: TEXTES.production.recettes.edition.titreNouvelle }} />
      <Stack.Screen
        name="registre-analyses"
        options={{ title: TEXTES.analysesProduits.registre.titre, headerLeft: enteteDuBatiment() }}
      />
      <Stack.Screen name="analyse-produit" options={{ title: TEXTES.analysesProduits.modifier }} />
      <Stack.Screen name="lot-abattoir" options={{ title: TEXTES.cheptel.lots.depart.titre }} />
      <Stack.Screen name="documents-gds" options={{ title: TEXTES.gds.documents.titre }} />
      <Stack.Screen name="flotte" options={{ title: TEXTES.flotte.titre }} />
      <Stack.Screen name="vehicule" options={{ title: TEXTES.flotte.titreFiche }} />
      <Stack.Screen name="rapports-essais" options={{ title: TEXTES.gds.documents.titreRapports }} />
      <Stack.Screen name="rapport-essais" options={{ title: TEXTES.gds.documents.titreRapports }} />
      <Stack.Screen name="terrain" options={{ title: TEXTES.accueil.ferme.terrain.titres.troupeau }} />
      <Stack.Screen name="lait-du-jour" options={{ title: TEXTES.stock.laitJour.ajouter }} />
      <Stack.Screen name="depart" options={{ title: TEXTES.exploitation.ventesVivants.titreFiche }} />
      <Stack.Screen name="ventes-vivants" options={{ title: TEXTES.exploitation.ventesVivants.titre }} />
      <Stack.Screen name="cadre-reglementaire" options={{ title: TEXTES.exploitation.cadreAtelier.titre }} />
      <Stack.Screen name="enlevements" options={{ title: TEXTES.exploitation.enlevements.titre }} />
      <Stack.Screen name="enlevement" options={{ title: TEXTES.exploitation.enlevements.titreFiche }} />
      <Stack.Screen name="oeufs" options={{ title: TEXTES.production.oeufs.titre }} />
      <Stack.Screen name="statistiques" options={{ title: TEXTES.stock.statistiques.titre }} />
      <Stack.Screen
        name="controles/liste"
        options={({ route }) => ({
          title:
            TEXTES.exploitation.controles.familles[
              ((route.params as { famille?: string } | undefined)?.famille ?? 'laitier') as FamilleControle
            ].titre,
        })}
      />
      <Stack.Screen name="controles/nouvelle" options={({ route }) => enteteControle(route.params)} />
    </Stack>
  );
}
