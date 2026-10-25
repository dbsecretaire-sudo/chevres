import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  tuilesDuTerrain,
  titreDuTerrain,
  ZONES_TERRAIN,
  type ComptesTerrain,
  type ZoneTerrain,
} from '@/features/accueil/terrain/ecransTerrain';
import { GrilleDeTuiles } from '@/features/accueil/terrain/GrilleDeTuiles';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/** La tuile remplie en vert sur chaque zone, comme sur la maquette : Scanner une chèvre, Scanner un lot, Nouvelle visite. */
const TUILE_PRINCIPALE: Partial<Record<ZoneTerrain, string>> = {
  troupeau: 'scanner',
  atelier: 'scanLot',
  accueil: 'nouvelleVisite',
};

/**
 * Les grandes tuiles d'une zone, avec le chiffre utile de chacune. Sert à l'écran terrain (une page ouverte d'un appui sur la zone) et, sur le téléphone,
 * à l'accueil des onglets Chèvres et Atelier, comme sur la maquette.
 */
export function GrilleTerrain({ zone, enTete }: { zone: ZoneTerrain; enTete?: ReactNode }) {
  const ouvrir = useOuvrir();
  const f = useFermeAccueil();
  const comptes: ComptesTerrain = {
    animaux: f.stats?.totalVivantes,
    naissances: f.stats?.cabritsAnnee,
    delais: f.delais,
    ventesSansDocument: f.ventesSansDocument,
    aCompleter: f.aCompleter,
    lotsAFacturer: f.lotsAFacturer,
    viandeAFacturer: f.transformation.viande,
    viandeAVendre: f.viandeAVendre,
    lotsARappeler: f.lotsARappeler,
    stockNegatif: f.stockNegatif,
    visitesAVenir: f.agritourisme.aVenir,
  };
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <ScrollView style={commonStyles.screenBg} contentContainerStyle={styles.contenu}>
        {/* Ce qui demande une action (alertes de santé, rappels) passe au-dessus des tuiles. */}
        {enTete}
        <GrilleDeTuiles tuiles={tuilesDuTerrain(zone, comptes)} principale={TUILE_PRINCIPALE[zone]} onAppui={(t) => ouvrir(t.route)} />
      </ScrollView>
    </AccentColorProvider>
  );
}

/**
 * L'écran « terrain » d'une zone de l'accueil (le troupeau, le travail du produit, la fabrication, l'accueil du public) : de très grands boutons, une action chacun,
 * avec le chiffre utile dessus. Il s'ouvre d'un appui sur la partie animée de la zone, à la place de la page d'avant (qui reste dans les menus).
 */
export default function EcranTerrain() {
  const { zone: zoneDemandee } = useLocalSearchParams<{ zone?: string }>();
  const zone: ZoneTerrain = ZONES_TERRAIN.find((z) => z === zoneDemandee) ?? 'troupeau';
  return (
    <>
      <Stack.Screen options={{ title: titreDuTerrain(zone) }} />
      <GrilleTerrain zone={zone} />
    </>
  );
}
