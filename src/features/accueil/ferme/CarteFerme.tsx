import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMouvementReduit } from '@/features/accueil/ferme/animations';
import { EnclosFerme } from '@/features/accueil/ferme/EnclosFerme';
import {
  CARTE,
  CENTRE,
  ENCLOS,
  LIEU,
  LIEUX,
  ROUTES_GRISES,
  borner,
  bornes,
  centrerSur,
  decor,
  type CleLieu,
} from '@/features/accueil/services/carteFerme';
import type { Chevre } from '@/features/cheptel/types';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme;

/** Où mène chaque lieu de la carte. */
const ROUTE_DU_LIEU: Record<CleLieu, string> = {
  foin: `${ROUTES.COMPTABILITE_STOCKS}?onglet=aliments`,
  laiterie: ROUTES.PRODUCTION_LAITERIE,
  fromagerie: ROUTES.PRODUCTION_FROMAGES,
  charcuterie: ROUTES.PRODUCTION_CHARCUTERIE,
  abattoir: `${ROUTES.PRODUCTION_VIANDE}?onglet=afacturer`,
  veterinaire: ROUTES.CHEPTEL_TRAITEMENTS,
  contacts: ROUTES.CONTACTS,
};

interface Props {
  vedettes: readonly Chevre[];
  nombreAnimaux?: number;
  naissances?: number;
  lotsAFacturer: number;
  lotsARappeler: number;
  /** Le troupeau est à l'estive : l'enclos devient une montagne. */
  estive?: { zone?: string; descente?: string };
}

/** Un lieu de la carte : son dessin, son nom, une pastille de ce qui attend ; un appui ouvre sa rubrique. */
function LieuDeLaCarte({ emoji, titre, pastille, route, x, y }: { emoji: string; titre: string; pastille?: string; route: string; x: number; y: number }) {
  const router = useRouter();
  return (
    <Pressable
      style={[styles.lieu, { left: x - LIEU.largeur / 2, top: y - LIEU.hauteur / 2 }]}
      onPress={() => router.push(route as never)}
      accessibilityRole="button"
      accessibilityLabel={pastille ? `${titre} : ${pastille}` : titre}
    >
      <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
        {emoji}
      </Text>
      <Text style={styles.titreLieu} numberOfLines={2}>
        {titre}
      </Text>
      {pastille ? (
        <View style={styles.pastille}>
          <Text style={styles.pastilleTexte}>{pastille}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * La carte de la ferme : une grande pelouse, des routes grises, l'enclos au centre et les lieux (aliments, laiterie, fromagerie, boucherie,
 * abattoir, vétérinaire, clients) au bout des routes. On la fait glisser du doigt (sur ordinateur, en gardant le bouton de la souris
 * enfoncé) : elle suit le doigt, puis glisse encore un peu. Elle ne montre jamais au-delà de ses bords.
 */
export function CarteFerme({ vedettes, nombreAnimaux, naissances, lotsAFacturer, lotsARappeler, estive }: Props) {
  const reduit = useMouvementReduit();
  const [x] = useState(() => new Animated.Value(0));
  const [y] = useState(() => new Animated.Value(0));
  // Ce que la main sait de la carte : la taille de la vue, la position actuelle et celle d'où le doigt est parti.
  const etat = useRef({ largeur: 0, hauteur: 0, x: 0, y: 0, departX: 0, departY: 0 });
  const [aideVisible, setAideVisible] = useState(true);
  const [arbres] = useState(decor);

  useEffect(() => {
    const ix = x.addListener(({ value }) => {
      etat.current.x = value;
    });
    const iy = y.addListener(({ value }) => {
      etat.current.y = value;
    });
    return () => {
      x.removeListener(ix);
      y.removeListener(iy);
    };
  }, [x, y]);

  // Le geste ne lit `etat` que quand le doigt bouge, jamais pendant l'affichage : le lint ne peut pas le voir.
  // eslint-disable-next-line react-hooks/refs
  const [mains] = useState(() => {
    const bornesActuelles = () => ({ x: bornes(etat.current.largeur, CARTE.largeur), y: bornes(etat.current.hauteur, CARTE.hauteur) });
    return PanResponder.create({
      // Dès que le doigt a bougé de quelques points, la carte prend la main : un appui court sur un lieu l'ouvre toujours.
      onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        x.stopAnimation();
        y.stopAnimation();
        etat.current.departX = etat.current.x;
        etat.current.departY = etat.current.y;
        setAideVisible(false);
      },
      onPanResponderMove: (_e, g) => {
        const b = bornesActuelles();
        x.setValue(borner(etat.current.departX + g.dx, b.x));
        y.setValue(borner(etat.current.departY + g.dy, b.y));
      },
      onPanResponderRelease: (_e, g) => {
        const b = bornesActuelles();
        // Elle glisse encore un peu dans le sens du geste, sans dépasser ses bords.
        const cibleX = borner(etat.current.x + g.vx * 320, b.x);
        const cibleY = borner(etat.current.y + g.vy * 320, b.y);
        if (cibleX === etat.current.x && cibleY === etat.current.y) return;
        Animated.parallel([
          Animated.timing(x, { toValue: cibleX, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false, isInteraction: false }),
          Animated.timing(y, { toValue: cibleY, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false, isInteraction: false }),
        ]).start();
      },
    });
  });

  /** À la mesure de la vue (et à chaque changement de taille de la fenêtre) : la carte se centre la première fois, sinon reste dans ses bords. */
  const mesurer = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const premiere = etat.current.largeur === 0;
    etat.current.largeur = width;
    etat.current.hauteur = height;
    if (premiere) {
      x.setValue(centrerSur(CENTRE.x, width, CARTE.largeur));
      y.setValue(centrerSur(CENTRE.y, height, CARTE.hauteur));
    } else {
      x.setValue(borner(etat.current.x, bornes(width, CARTE.largeur)));
      y.setValue(borner(etat.current.y, bornes(height, CARTE.hauteur)));
    }
  };

  const recentrer = () => {
    const cibleX = centrerSur(CENTRE.x, etat.current.largeur, CARTE.largeur);
    const cibleY = centrerSur(CENTRE.y, etat.current.hauteur, CARTE.hauteur);
    if (reduit) {
      x.setValue(cibleX);
      y.setValue(cibleY);
      return;
    }
    Animated.parallel([
      Animated.timing(x, { toValue: cibleX, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: false, isInteraction: false }),
      Animated.timing(y, { toValue: cibleY, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: false, isInteraction: false }),
    ]).start();
  };

  const titres: Record<CleLieu, string> = {
    foin: T.zones.foin,
    laiterie: T.zones.laiterie,
    fromagerie: T.zones.fromagerie,
    charcuterie: T.zones.charcuterie,
    abattoir: T.zones.abattoir,
    veterinaire: T.zones.veterinaire,
    contacts: T.zones.contacts,
  };
  const pastilles: Partial<Record<CleLieu, string>> = {
    fromagerie: lotsARappeler > 0 ? T.zones.lotsARappeler(lotsARappeler) : undefined,
    abattoir: lotsAFacturer > 0 ? T.zones.lotsAFacturer(lotsAFacturer) : undefined,
  };

  return (
    <View style={styles.vue} onLayout={mesurer} {...mains.panHandlers}>
      <Animated.View style={[styles.carte, { width: CARTE.largeur, height: CARTE.hauteur, transform: [{ translateX: x }, { translateY: y }] }]}>
        {arbres.map((a, i) => (
          <Text key={i} style={[styles.decor, { left: a.x, top: a.y, fontSize: a.taille }]} accessibilityElementsHidden importantForAccessibility="no">
            {a.emoji}
          </Text>
        ))}
        {ROUTES_GRISES.map((r, i) => (
          <View key={i} style={[styles.route, { left: r.x, top: r.y, width: r.largeur, height: r.hauteur }]} />
        ))}
        <View style={{ position: 'absolute', left: CENTRE.x - ENCLOS.largeur / 2, top: CENTRE.y - ENCLOS.hauteur / 2, width: ENCLOS.largeur, height: ENCLOS.hauteur }}>
          <EnclosFerme vedettes={vedettes} nombreAnimaux={nombreAnimaux} naissances={naissances} estive={estive} />
        </View>
        {LIEUX.map((l) => (
          <LieuDeLaCarte key={l.cle} emoji={l.emoji} titre={titres[l.cle]} pastille={pastilles[l.cle]} route={ROUTE_DU_LIEU[l.cle]} x={l.x} y={l.y} />
        ))}
      </Animated.View>
      {aideVisible ? (
        <View style={styles.aide} pointerEvents="none">
          <Text style={styles.aideTexte}>{T.carte.aide}</Text>
        </View>
      ) : null}
      <Pressable style={styles.recentrer} onPress={recentrer} accessibilityRole="button" accessibilityLabel={T.carte.recentrer}>
        <Ionicons name="locate" size={22} color={colors.blanc} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  vue: { flex: 1, overflow: 'hidden', backgroundColor: '#BBD58E', userSelect: 'none' },
  carte: { position: 'absolute', left: 0, top: 0, backgroundColor: '#BBD58E' },
  decor: { position: 'absolute' },
  route: { position: 'absolute', backgroundColor: '#B4B4AC', borderRadius: 6, borderWidth: 2, borderColor: '#8E8E86' },
  lieu: {
    position: 'absolute',
    width: LIEU.largeur,
    height: LIEU.hauteur,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 6,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emoji: { fontSize: 38 },
  titreLieu: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },
  pastille: { position: 'absolute', top: -10, right: -6, backgroundColor: colors.danger, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pastilleTexte: { color: colors.blanc, fontSize: 12, fontWeight: '700' },
  aide: { position: 'absolute', bottom: 62, left: 0, right: 0, alignItems: 'center' },
  aideTexte: { backgroundColor: 'rgba(0,0,0,0.55)', color: colors.blanc, fontSize: 13, fontWeight: '600', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, overflow: 'hidden' },
  recentrer: { position: 'absolute', bottom: 12, alignSelf: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.blanc, alignItems: 'center', justifyContent: 'center' },
});
