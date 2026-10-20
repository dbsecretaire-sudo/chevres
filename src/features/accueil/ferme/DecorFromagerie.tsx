import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

const INOX = '#CDD2D6';
const INOX_CLAIR = '#E3E7EA';
const BORD = '#9AA3AA';
const POIGNEE = '#6F7A82';

/** Les mesures du décor, à l'échelle : `s(n)` est la mesure `n` du dessin d'origine. */
function creerStyles(echelle: number) {
  const s = (n: number) => Math.max(1, Math.round(n * echelle));
  return StyleSheet.create({
    mur: { backgroundColor: '#EEF2F3', paddingTop: s(10) },
    rangee: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      paddingHorizontal: s(12),
      height: s(112),
    },
    plinthe: { height: s(8), backgroundColor: '#B9C1C6' },
    porte: {
      backgroundColor: INOX,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: BORD,
      borderRadius: s(3),
      overflow: 'hidden',
      justifyContent: 'center',
    },
    reflet: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '30%',
      backgroundColor: INOX_CLAIR,
      opacity: 0.8,
    },
    poignee: { position: 'absolute', right: s(4), width: s(3), height: s(16), borderRadius: 2, backgroundColor: POIGNEE },
    moitie: { flex: 1 },
    frigo: { width: s(56), height: s(108), gap: s(2) },
    congelateur: { height: s(34) },
    plein: { flex: 1 },
    evier: { width: s(132), height: s(108) },
    placards: { flexDirection: 'row', gap: s(2), height: s(30) },
    zoneRobinet: { height: s(20), alignItems: 'center', justifyContent: 'flex-end' },
    robinetColonne: { width: s(4), height: s(12), backgroundColor: POIGNEE, borderRadius: 2 },
    robinetBec: {
      position: 'absolute',
      top: s(2),
      width: s(12),
      height: s(4),
      backgroundColor: POIGNEE,
      borderRadius: 2,
      left: '50%',
    },
    plan: {
      height: s(8),
      backgroundColor: INOX_CLAIR,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: BORD,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cuve: { width: s(56), height: s(4), borderRadius: 2, backgroundColor: BORD },
    bas: { flexDirection: 'row', gap: s(2), flex: 1 },
    armoire: { width: s(72), height: s(104), flexDirection: 'row', gap: s(2) },
  });
}

type Styles = ReturnType<typeof creerStyles>;

/** Une porte en inox : un panneau lisse avec un reflet, et sa poignée. */
function Porte({ styles, style }: { styles: Styles; style?: object }) {
  return (
    <View style={[styles.porte, style]}>
      <View style={styles.reflet} />
      <View style={styles.poignee} />
    </View>
  );
}

/** La hauteur du décor à cette échelle (le mur, ses appareils et la plinthe) : de quoi réserver la place sous lui. */
export const hauteurDuDecor = (echelle: number): number => Math.round(10 * echelle) + Math.round(112 * echelle) + Math.round(8 * echelle);

/**
 * Le mur de la fromagerie, tel qu'on le voit du carrelage : un frigo (le congélateur en haut), l'évier avec ses placards, son plan de travail et son
 * robinet, et une armoire, le tout en inox. Un décor dessiné en formes simples, sans animation ; `echelle` le réduit pour une carte.
 */
export function DecorFromagerie({ echelle = 1 }: { echelle?: number }) {
  const styles = useMemo(() => creerStyles(echelle), [echelle]);
  return (
    <View style={styles.mur} pointerEvents="none">
      <View style={styles.rangee}>
        <View style={styles.frigo}>
          <Porte styles={styles} style={styles.congelateur} />
          <Porte styles={styles} style={styles.plein} />
        </View>
        <View style={styles.evier}>
          <View style={styles.placards}>
            <Porte styles={styles} style={styles.moitie} />
            <Porte styles={styles} style={styles.moitie} />
          </View>
          <View style={styles.zoneRobinet}>
            <View style={styles.robinetColonne} />
            <View style={styles.robinetBec} />
          </View>
          <View style={styles.plan}>
            <View style={styles.cuve} />
          </View>
          <View style={styles.bas}>
            <Porte styles={styles} style={styles.moitie} />
            <Porte styles={styles} style={styles.moitie} />
          </View>
        </View>
        <View style={styles.armoire}>
          <Porte styles={styles} style={styles.moitie} />
          <Porte styles={styles} style={styles.moitie} />
        </View>
      </View>
      <View style={styles.plinthe} />
    </View>
  );
}
