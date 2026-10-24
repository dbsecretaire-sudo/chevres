import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GrosBouton } from '@/shared/components/GrosBouton';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';
import { colors } from '@/shared/theme/colors';

/** Comment les choix se montrent : de très grands boutons (le mode normal, une main gantée) ou des tuiles blanches en grille (le mode avancé). */
export type PresentationDesChoix = 'gros' | 'tuiles';

export interface Choix {
  cle: string;
  libelle: string;
  /** L'icône (MaterialCommunityIcons) : le bouton ou la tuile la montre quand elle est donnée. */
  icone?: keyof typeof MaterialCommunityIcons.glyphMap;
}

/** Une liste de choix, en très grands boutons ou en tuiles. Un appui rend le choix touché. */
export function ListeDeChoix({
  choix,
  presentation,
  onChoisir,
}: {
  choix: Choix[];
  presentation: PresentationDesChoix;
  onChoisir: (choix: Choix) => void;
}) {
  if (presentation === 'gros')
    return (
      <>
        {choix.map((c) => (
          <GrosBouton
            key={c.cle}
            libelle={c.libelle}
            onPress={() => onChoisir(c)}
            icone={c.icone ? <MaterialCommunityIcons name={c.icone} size={44} color={colors.blanc} /> : undefined}
          />
        ))}
      </>
    );
  return (
    <View style={styles.grille}>
      {choix.map((c) => (
        <Pressable
          key={c.cle}
          onPress={() => onChoisir(c)}
          accessibilityRole="button"
          accessibilityLabel={c.libelle}
          style={({ pressed }) => [styles.tuile, pressed ? styles.tuileAppuyee : null]}
        >
          <View style={styles.haut}>
            {c.icone ? <MaterialCommunityIcons name={c.icone} size={44} color={colors.primary} /> : null}
          </View>
          <Text style={styles.titre} numberOfLines={2}>
            {c.libelle}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
