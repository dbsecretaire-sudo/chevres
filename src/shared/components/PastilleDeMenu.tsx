import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/theme/colors';

/**
 * Une pastille de la barre du haut de l'accueil : un mot sur un fond blanc, dans une capsule verte ; les quatre pastilles se partagent la largeur. Ce sont les menus qu'on
 * touche rarement (l'année, l'espèce, le didacticiel, l'organisation) : ils sont en haut, loin du pouce, et l'essentiel est en bas.
 */
export function PastilleDeMenu({ libelle, onPress }: { libelle: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pastille, pressed && styles.appuyee]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={libelle}
    >
      <Text style={styles.texte} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {libelle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pastille: {
    // Chaque pastille prend la place de son mot, et les pastilles se partagent le reste : « Organisation » n'est jamais coupé.
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    // Une pastille blanche, comme celles du bandeau du bas : elles se posent dans la capsule verte de la barre.
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  appuyee: { opacity: 0.8 },
  texte: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
