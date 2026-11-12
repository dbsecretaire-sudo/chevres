import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** Le texte de l'onglet actif (26 points) est presque deux fois plus grand que celui des autres (14) : son onglet a un coefficient de largeur à la mesure. */
const COEFFICIENT_ACTIF = 1.9;

interface OngletTitre {
  libelle: string;
  /** Absent pour la page courante : elle ne se touche pas. */
  onPress?: () => void;
}

/**
 * Un titre à onglets : la page courante en gras, au milieu d'une rangée de pages voisines (Ferme, Atelier, Commerce, Documents). Un appui sur une
 * autre page l'ouvre, sans passer par un menu.
 */
export function TitreAOnglets({ onglets, courant }: { onglets: OngletTitre[]; courant: string }) {
  return (
    <View style={styles.cadre}>
      {onglets.map((onglet, i) => {
        const actif = onglet.libelle === courant;
        return (
          <Pressable
            key={onglet.libelle}
            disabled={actif || !onglet.onPress}
            onPress={onglet.onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: actif }}
            // La largeur suit la longueur du nom ; l'onglet actif, écrit plus gros, en prend davantage.
            style={({ pressed }) => [
              styles.onglet,
              { flex: onglet.libelle.length * (actif ? COEFFICIENT_ACTIF : 1) },
              i > 0 && styles.separe,
              actif && styles.actif,
              pressed && !actif && styles.appuye,
            ]}
          >
            <Text style={[styles.texte, actif && styles.texteActif]} numberOfLines={1}>
              {onglet.libelle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.badgeBg,
  },
  onglet: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  separe: { borderLeftWidth: 1, borderLeftColor: colors.primary },
  actif: { backgroundColor: colors.surface },
  appuye: { opacity: 0.7 },
  texte: { fontSize: 14, fontWeight: '700', color: colors.primary },
  // La page courante a le style du titre des pages (voir EnTeteApplication : 26, très gras).
  texteActif: { fontSize: 26, fontWeight: '800', color: colors.text },
});
