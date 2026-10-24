import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  tuilesDuTerrain,
  titreDuTerrain,
  ZONES_TERRAIN,
  type ComptesTerrain,
  type ZoneTerrain,
} from '@/features/accueil/terrain/ecransTerrain';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/**
 * L'écran « terrain » d'une zone de l'accueil (le troupeau, le travail du produit, l'accueil du public) : de très grands boutons, une action chacun, avec le chiffre utile dessus.
 * Il s'ouvre d'un appui sur la partie animée de la zone, à la place de la page d'avant (qui reste dans les menus).
 */
export default function EcranTerrain() {
  const { zone: zoneDemandee } = useLocalSearchParams<{ zone?: string }>();
  const zone: ZoneTerrain = ZONES_TERRAIN.find((z) => z === zoneDemandee) ?? 'troupeau';
  const ouvrir = useOuvrir();
  const f = useFermeAccueil();
  const comptes: ComptesTerrain = {
    animaux: f.stats?.totalVivantes,
    naissances: f.stats?.cabritsAnnee,
    delais: f.delais,
    ventesSansDocument: f.ventesSansDocument,
    lotsAFacturer: f.lotsAFacturer,
    viandeAFacturer: f.transformation.viande,
    lotsARappeler: f.lotsARappeler,
    stockNegatif: f.stockNegatif,
    visitesAVenir: f.agritourisme.aVenir,
  };
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Stack.Screen options={{ title: titreDuTerrain(zone) }} />
      <ScrollView style={commonStyles.screenBg} contentContainerStyle={styles.contenu}>
        <View style={styles.grille}>
          {tuilesDuTerrain(zone, comptes).map((t) => (
            <Pressable
              key={t.cle}
              onPress={() => ouvrir(t.route)}
              accessibilityRole="button"
              accessibilityLabel={t.nombre ? `${t.titre} : ${t.nombre}` : t.titre}
              style={({ pressed }) => [styles.tuile, pressed ? styles.tuileAppuyee : null]}
            >
              <View style={styles.haut}>
                {t.iconeMci ? (
                  <MaterialCommunityIcons name={t.iconeMci} size={44} color={colors.primary} />
                ) : (
                  <Ionicons name={t.icone} size={44} color={colors.primary} />
                )}
                {t.nombre ? <Text style={[styles.nombre, t.alerte ? styles.nombreAlerte : null]}>{t.nombre}</Text> : null}
              </View>
              <Text style={styles.titre} numberOfLines={2}>
                {t.titre}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </AccentColorProvider>
  );
}
