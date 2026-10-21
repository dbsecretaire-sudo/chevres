import { StyleSheet, Text, View } from 'react-native';

/** Les carreaux de la nappe : des bandes blanches, croisées, sur le rouge. */
const BANDES = [18, 54, 90] as const;
const LIGNES = [14, 40] as const;

/** Un pickup blanc de profil (un émoji ne se recolore pas) : une benne ouverte derrière, une cabine à pare-brise incliné devant, un capot, deux roues. */
function Pickup({ echelle }: { echelle: number }) {
  const s = (n: number) => Math.round(n * echelle);
  const bord = '#9AA5AD';
  const blanc = { position: 'absolute', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: bord } as const;
  return (
    <View style={{ width: s(82), height: s(40) }}>
      {/* Le bas de caisse, d'un bout à l'autre. */}
      <View style={[blanc, { left: 0, bottom: s(9), width: s(82), height: s(13), borderRadius: 3 }]} />
      {/* La benne : un fond sombre entre deux parois. */}
      <View style={{ position: 'absolute', left: s(2), bottom: s(22), width: s(34), height: s(8), backgroundColor: '#C9D1D6', borderWidth: 1, borderColor: bord }} />
      <View style={[blanc, { left: 0, bottom: s(22), width: s(4), height: s(10) }]} />
      {/* La cabine, avec son pare-brise incliné et sa vitre. */}
      <View style={[blanc, { left: s(38), bottom: s(22), width: s(30), height: s(17), borderTopLeftRadius: s(3), borderTopRightRadius: s(14) }]} />
      <View style={{ position: 'absolute', left: s(42), bottom: s(26), width: s(20), height: s(10), backgroundColor: '#BFE0F2', borderTopLeftRadius: s(2), borderTopRightRadius: s(10) }} />
      {/* Le capot, devant, et un phare. */}
      <View style={[blanc, { left: s(66), bottom: s(22), width: s(16), height: s(6), borderTopRightRadius: s(4) }]} />
      <View style={{ position: 'absolute', left: s(77), bottom: s(15), width: s(5), height: s(5), borderRadius: s(3), backgroundColor: '#F5D76E' }} />
      {/* Les roues : un pneu sombre, un moyeu clair. */}
      {[10, 56].map((x) => (
        <View
          key={x}
          style={{ position: 'absolute', left: s(x), bottom: 0, width: s(17), height: s(17), borderRadius: s(9), backgroundColor: '#2F3437', alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: s(7), height: s(7), borderRadius: s(4), backgroundColor: '#C5CCD1' }} />
        </View>
      ))}
    </View>
  );
}

/** Les nuages blancs : quelques bosses blanches, posées dans le ciel derrière les logos. */
const NUAGES = [
  { x: 6, y: 6, echelle: 1 },
  { x: 62, y: 2, echelle: 0.85 },
  { x: 36, y: 38, echelle: 0.7 },
  { x: 74, y: 52, echelle: 0.9 },
] as const;

export function NuagesBlancs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {NUAGES.map((n, i) => (
        <View key={i} style={[styles.nuage, { left: `${n.x}%`, top: `${n.y}%`, transform: [{ scale: n.echelle }] }]}>
          <View style={[styles.bosse, { left: 0, top: 14, width: 34, height: 24 }]} />
          <View style={[styles.bosse, { left: 20, top: 0, width: 44, height: 34 }]} />
          <View style={[styles.bosse, { left: 52, top: 10, width: 38, height: 26 }]} />
          <View style={[styles.bosse, { left: 10, top: 20, width: 72, height: 18 }]} />
        </View>
      ))}
    </View>
  );
}

/**
 * Le décor champêtre du côté Agritourisme, à la place de la rue : un pré, une nappe à carreaux avec un panier et de quoi manger, une chèvre,
 * un pickup garé, des arbres et des fleurs. Rien n'y rappelle la fromagerie. Dessiné en formes simples et en émojis, sans rien d'interactif.
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
            <Text style={[styles.fleur, { left: '24%', top: '62%', fontSize: s(14) }]}>🌼</Text>
      <Text style={[styles.fleur, { left: '58%', top: '78%', fontSize: s(14) }]}>🌷</Text>
      <Text style={[styles.fleur, { left: '90%', top: '78%', fontSize: s(12) }]}>🌼</Text>
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
      {/* Le pickup, garé près de la nappe : on est venu pique-niquer à la ferme. */}
      <View style={[styles.sur, { left: '71%', top: '30%' }]}>
        <Pickup echelle={echelle} />
      </View>
      {/* La chèvre, près de la nappe (immobile). */}
      <Text style={[styles.sur, { left: '14%', top: '34%', fontSize: s(34) }]}>🐐</Text>
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
  nuage: { position: 'absolute', width: 90, height: 40 },
  bosse: { position: 'absolute', borderRadius: 20, backgroundColor: '#FFFFFF' },
});
