import { StyleSheet, Text, View } from 'react-native';
import { Balade } from '@/features/accueil/ferme/animations';

/** Les carreaux de la nappe : des bandes blanches, croisées, sur le rouge. */
const BANDES = [18, 54, 90] as const;
const LIGNES = [14, 40] as const;

/**
 * Le décor champêtre du côté Agritourisme, à la place de la rue : un pré, une nappe à carreaux avec un panier et de quoi manger, une chèvre qui se promène,
 * des arbres et des fleurs. Rien n'y rappelle la fromagerie. Dessiné en formes simples et en émojis, sans rien d'interactif.
 */
export function DecorPiqueNique({ hauteur, echelle }: { hauteur: number; echelle: number }) {
  const s = (n: number) => Math.round(n * echelle);
  return (
    <View
      style={[styles.pre, { height: hauteur }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Une colline au fond, plus claire que le pré. */}
      <View style={styles.colline} />
      <Text style={[styles.arbre, { left: '4%', fontSize: s(34) }]}>🌳</Text>
      <Text style={[styles.arbre, { right: '5%', fontSize: s(30) }]}>🌲</Text>
      <Text style={[styles.fleur, { left: '24%', top: '62%', fontSize: s(14) }]}>🌼</Text>
      <Text style={[styles.fleur, { left: '70%', top: '70%', fontSize: s(14) }]}>🌷</Text>
      <Text style={[styles.fleur, { left: '84%', top: '48%', fontSize: s(12) }]}>🌼</Text>
      {/* La nappe à carreaux, posée de biais, avec le panier et le repas. */}
      <View style={[styles.nappe, { width: s(130), height: s(54), left: '50%', marginLeft: -s(65), top: '28%' }]}>
        {BANDES.map((x) => (
          <View key={`v${x}`} style={[styles.bande, { left: s(x), top: 0, bottom: 0, width: s(14) }]} />
        ))}
        {LIGNES.map((y) => (
          <View key={`h${y}`} style={[styles.bande, { top: s(y), left: 0, right: 0, height: s(10) }]} />
        ))}
      </View>
      <Text style={[styles.sur, { left: '36%', top: '14%', fontSize: s(26) }]}>🧺</Text>
      <Text style={[styles.sur, { left: '49%', top: '30%', fontSize: s(18) }]}>🧀</Text>
      <Text style={[styles.sur, { left: '55%', top: '24%', fontSize: s(18) }]}>🍎</Text>
      <Text style={[styles.sur, { left: '61%', top: '32%', fontSize: s(18) }]}>🥖</Text>
      {/* La chèvre, qui se promène près de la nappe. */}
      <View style={[styles.chevre, { left: '14%', top: '34%' }]}>
        <Balade amplitude={10} amplitudeY={3} duree={3200}>
          <Text style={{ fontSize: s(34) }}>🐐</Text>
        </Balade>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pre: { backgroundColor: '#C9E2A8', overflow: 'hidden' },
  colline: {
    position: 'absolute',
    left: '-10%',
    right: '-10%',
    top: -60,
    height: 90,
    borderRadius: 400,
    backgroundColor: '#B3D58E',
  },
  arbre: { position: 'absolute', top: '6%' },
  fleur: { position: 'absolute' },
  nappe: {
    position: 'absolute',
    backgroundColor: '#C0392B',
    borderRadius: 6,
    overflow: 'hidden',
    transform: [{ rotate: '-4deg' }],
  },
  bande: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.72)' },
  sur: { position: 'absolute' },
  chevre: { position: 'absolute' },
});
