import { StyleSheet, View } from 'react-native';

/**
 * Le décor de l'enclos, dessiné en formes simples et sans animation : un sentier de chèvres (le parcours caprin) qui serpente, des arbres, des
 * touffes de maquis et de petites fleurs. Il reste sur les bords et en fond : le titre, le troupeau et l'effectif passent par-dessus.
 */

const FLEURS = [
  { x: 8, y: 30, couleur: '#E86F9A' },
  { x: 18, y: 14, couleur: '#F2C94C' },
  { x: 30, y: 6, couleur: '#FFFFFF' },
  { x: 62, y: 10, couleur: '#9B7BD3' },
  { x: 72, y: 20, couleur: '#E86F9A' },
  { x: 90, y: 34, couleur: '#F2C94C' },
  { x: 86, y: 56, couleur: '#FFFFFF' },
  { x: 6, y: 56, couleur: '#9B7BD3' },
  { x: 24, y: 78, couleur: '#E86F9A' },
  { x: 50, y: 90, couleur: '#F2C94C' },
  { x: 68, y: 82, couleur: '#FFFFFF' },
  { x: 40, y: 22, couleur: '#E86F9A' },
] as const;

const MAQUIS = [
  { x: 4, y: 82 },
  { x: 44, y: 3 },
  { x: 84, y: 44 },
  { x: 14, y: 46 },
] as const;

const ARBRES = [
  { x: 5, y: 6, taille: 30 },
  { x: 80, y: 5, taille: 34 },
  { x: 76, y: 66, taille: 28 },
] as const;

/** Les marques du sentier : de petites pierres plates, du bas gauche vers le haut droit, en deux courbes. */
const SENTIER = [
  { x: 8, y: 92, angle: -20 },
  { x: 16, y: 87, angle: -28 },
  { x: 25, y: 81, angle: -22 },
  { x: 34, y: 77, angle: -8 },
  { x: 43, y: 76, angle: 6 },
  { x: 52, y: 72, angle: -18 },
  { x: 60, y: 66, angle: -34 },
  { x: 66, y: 58, angle: -52 },
  { x: 70, y: 49, angle: -62 },
  { x: 74, y: 40, angle: -58 },
] as const;

function Fleur({ x, y, couleur }: { x: number; y: number; couleur: string }) {
  return (
    <View style={[styles.fleur, { left: `${x}%`, top: `${y}%` }]}>
      <View style={[styles.petale, { backgroundColor: couleur }]} />
      <View style={styles.coeur} />
      <View style={styles.tige} />
    </View>
  );
}

function Touffe({ x, y }: { x: number; y: number }) {
  return (
    <View style={[styles.touffe, { left: `${x}%`, top: `${y}%` }]}>
      <View style={[styles.buisson, styles.buissonFonce, { left: 0, width: 20, height: 12 }]} />
      <View style={[styles.buisson, styles.buissonClair, { left: 9, top: -4, width: 18, height: 12 }]} />
      <View style={[styles.buisson, styles.buissonFonce, { left: 18, top: 1, width: 16, height: 10 }]} />
    </View>
  );
}

function Arbre({ x, y, taille }: { x: number; y: number; taille: number }) {
  return (
    <View style={[styles.arbre, { left: `${x}%`, top: `${y}%`, width: taille, height: taille * 1.2 }]}>
      <View
        style={[
          styles.cime,
          styles.cimeClaire,
          { width: taille * 0.8, height: taille * 0.8, borderRadius: taille * 0.4 },
        ]}
      />
      <View
        style={[
          styles.cime,
          styles.cimeFoncee,
          { width: taille * 0.6, height: taille * 0.6, borderRadius: taille * 0.3, top: taille * 0.3 },
        ]}
      />
      <View style={[styles.tronc, { height: taille * 0.4 }]} />
    </View>
  );
}

export function DecorEnclos() {
  return (
    <View
      style={styles.fond}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {SENTIER.map((p, i) => (
        <View
          key={i}
          style={[
            styles.pierre,
            { left: `${p.x}%`, top: `${p.y}%`, transform: [{ rotate: `${p.angle}deg` }] },
          ]}
        />
      ))}
      {MAQUIS.map((m, i) => (
        <Touffe key={i} x={m.x} y={m.y} />
      ))}
      {ARBRES.map((a, i) => (
        <Arbre key={i} x={a.x} y={a.y} taille={a.taille} />
      ))}
      {FLEURS.map((f, i) => (
        <Fleur key={i} x={f.x} y={f.y} couleur={f.couleur} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', borderRadius: 13 },
  pierre: {
    position: 'absolute',
    width: 15,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CDB98A',
    opacity: 0.85,
  },
  fleur: { position: 'absolute', width: 9, height: 16, alignItems: 'center' },
  petale: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  coeur: {
    position: 'absolute',
    top: 2.5,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F4B400',
  },
  tige: { width: 1.5, height: 7, backgroundColor: '#5E8C3A' },
  touffe: { position: 'absolute', width: 36, height: 16 },
  buisson: { position: 'absolute', borderRadius: 8 },
  buissonFonce: { backgroundColor: '#5F8A3E' },
  buissonClair: { backgroundColor: '#7BAA52' },
  arbre: { position: 'absolute', alignItems: 'center' },
  cime: { position: 'absolute', top: 0 },
  cimeClaire: { backgroundColor: '#6FA84A' },
  cimeFoncee: { backgroundColor: '#548A36', opacity: 0.9 },
  tronc: { position: 'absolute', bottom: 0, width: 5, backgroundColor: '#8A6238', borderRadius: 2 },
});
