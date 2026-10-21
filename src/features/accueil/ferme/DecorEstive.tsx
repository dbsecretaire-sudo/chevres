import { StyleSheet, View } from 'react-native';

/**
 * Le décor de l'enclos pendant l'estive, dessiné en formes simples et sans animation : de grandes montagnes enneigées au fond (leur pied juste au-dessus du
 * panneau de la gestion), des nuages en haut et des cailloux au sol. Ses couleurs restent douces : le titre, le troupeau et l'effectif passent par-dessus.
 */

const MONTAGNES = [
  { gauche: -8, largeur: 190, hauteur: 140, couleur: '#A9BDD2', neige: true },
  { gauche: 44, largeur: 190, hauteur: 175, couleur: '#B6C7DA', neige: true },
  { gauche: 22, largeur: 140, hauteur: 100, couleur: '#9DB2C9', neige: false },
] as const;

const NUAGES = [
  { x: 8, y: 6, echelle: 1 },
  { x: 58, y: 12, echelle: 0.8 },
  { x: 34, y: 2, echelle: 0.6 },
] as const;

const CAILLOUX = [
  { x: 6, y: 62, l: 16, h: 9 },
  { x: 24, y: 64, l: 10, h: 6 },
  { x: 40, y: 63, l: 12, h: 7 },
  { x: 62, y: 62, l: 18, h: 10 },
  { x: 76, y: 64, l: 9, h: 5 },
  { x: 88, y: 62, l: 13, h: 8 },
] as const;

function Montagne({
  gauche,
  largeur,
  hauteur,
  couleur,
  neige,
}: {
  gauche: number;
  largeur: number;
  hauteur: number;
  couleur: string;
  neige: boolean;
}) {
  return (
    <View style={[styles.montagne, { left: `${gauche}%`, width: largeur, height: hauteur }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: largeur / 2,
          borderRightWidth: largeur / 2,
          borderBottomWidth: hauteur,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: couleur,
        }}
      />
      {neige ? (
        <View
          style={{
            position: 'absolute',
            left: largeur * 0.35,
            top: 0,
            width: 0,
            height: 0,
            borderLeftWidth: largeur * 0.15,
            borderRightWidth: largeur * 0.15,
            borderBottomWidth: hauteur * 0.3,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#F4F8FC',
          }}
        />
      ) : null}
    </View>
  );
}

function Nuage({ x, y, echelle }: { x: number; y: number; echelle: number }) {
  return (
    <View style={[styles.nuage, { left: `${x}%`, top: `${y}%`, transform: [{ scale: echelle }] }]}>
      <View style={[styles.bosse, { left: 0, top: 8, width: 20, height: 14 }]} />
      <View style={[styles.bosse, { left: 12, top: 0, width: 26, height: 20 }]} />
      <View style={[styles.bosse, { left: 30, top: 6, width: 22, height: 15 }]} />
      <View style={[styles.bosse, { left: 6, top: 12, width: 44, height: 10 }]} />
    </View>
  );
}

export function DecorEstive() {
  return (
    <View
      style={styles.fond}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {MONTAGNES.map((m, i) => (
        <Montagne key={i} {...m} />
      ))}
      {/* Le sol, devant le pied des montagnes : ce qu'on en voit au-dessus du panneau de la gestion. */}
      <View style={styles.sol} />
      {NUAGES.map((n, i) => (
        <Nuage key={i} {...n} />
      ))}
      {CAILLOUX.map((c, i) => (
        <View
          key={i}
          style={[
            styles.caillou,
            { left: `${c.x}%`, top: `${c.y}%`, width: c.l, height: c.h, borderRadius: c.h },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', borderRadius: 13 },
  // Le pied des montagnes est au-dessus du panneau de la gestion (le bas de la scène) : elles se voient en entier.
  montagne: { position: 'absolute', bottom: '38%' },
  sol: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', backgroundColor: '#D3DFCB' },
  nuage: { position: 'absolute', width: 52, height: 24 },
  bosse: { position: 'absolute', borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.92)' },
  caillou: {
    position: 'absolute',
    backgroundColor: '#8E9AA6',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
