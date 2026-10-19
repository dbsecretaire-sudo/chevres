import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { actionsDuLieu, type ActionDeLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { AllerRetour, Derive, Pulsation, useMouvementReduit } from '@/features/accueil/ferme/animations';
import { BullesLieu } from '@/features/accueil/ferme/BullesLieu';
import { CamionVivant } from '@/features/accueil/ferme/CamionVivant';
import { ChevrerieInterieure } from '@/features/accueil/ferme/ChevrerieInterieure';
import { EnclosFerme } from '@/features/accueil/ferme/EnclosFerme';
import {
  CARTE,
  CENTRE,
  ENCLOS,
  ENTREE,
  FERME,
  LIEU,
  LIEUX,
  ROUTES_GRISES,
  STELE,
  borner,
  bornes,
  bornesEnPerspective,
  decor,
  echelleVueDEnsemble,
  montagnes,
  type CleLieu,
} from '@/features/accueil/services/carteFerme';
import type { Chevre } from '@/features/cheptel/types';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme;

/** La vue en perspective : l'éloignement (plus il est petit, plus le fond rapetisse) et l'inclinaison de la carte, bord proche en bas. */
const PERSPECTIVE = 1000;
const INCLINAISON = '26deg';
/** À quelle hauteur de la vue (0 en haut) se met le centre de l'enclos quand la carte se centre. */
const FOYER_VERTICAL = 0.62;
/** Le zoom le plus fort (la carte à 1,8 fois sa taille) ; le plus faible est la vue d'ensemble. */
const ZOOM_MAX = 1.8;
const SOL = '#BBD58E';

/** Où mène chaque lieu de la carte (sa page principale : un second appui dessus l'ouvre). */
const ROUTE_DU_LIEU: Record<CleLieu, string> = {
  foin: ROUTES.lieu('aliments'),
  organismes: ROUTES.lieu('organismes'),
  laiterie: ROUTES.PRODUCTION_LAITERIE,
  fromagerie: ROUTES.PRODUCTION_FROMAGES,
  charcuterie: ROUTES.lieu('boucherie'),
  abattoir: ROUTES.lieu('abattoir'),
  equarrissage: ROUTES.lieu('equarrissage'),
  veterinaire: ROUTES.lieu('veterinaire'),
  contacts: ROUTES.CONTACTS,
  pompe: ROUTES.lieu('carburant'),
  entrepot: ROUTES.lieu('entrepot'),
  commercial: ROUTES.lieu('commercial'),
};

interface Props {
  vedettes: readonly Chevre[];
  nombreAnimaux?: number;
  naissances?: number;
  lotsAFacturer: number;
  lotsARappeler: number;
  /** Les animaux morts dans l'année : la stèle près de l'enclos. */
  morts: number;
  /** Le troupeau est à l'estive : l'enclos devient une montagne. */
  estive?: { zone?: string; descente?: string };
  /** Le stock d'aliment, pour l'intérieur de la chèvrerie (les jours qu'il tient). */
  aliments: { kg: number; jours?: number } | null;
}

/**
 * Un lieu de la carte : son bâtiment dessiné en grand et debout sur la pelouse, ses compagnons à ses pieds, son ombre et la pancarte de bois
 * de son nom. Une bulle dit ce qui attend. Un appui l'écrase puis il rebondit. En vue d'ensemble il grossit (`contre` annule le
 * rapetissement de la carte) pour rester lisible.
 */
function LieuDeLaCarte({
  principal,
  compagnons,
  titre,
  pastille,
  x,
  y,
  ouvert,
  contre,
  onAppui,
}: {
  principal: string;
  compagnons: string;
  titre: string;
  pastille?: string;
  x: number;
  y: number;
  ouvert: boolean;
  contre: Animated.AnimatedInterpolation<number>;
  onAppui: () => void;
}) {
  const reduit = useMouvementReduit();
  const [ecrasement] = useState(() => new Animated.Value(1));
  const [echelle] = useState(() => Animated.multiply(ecrasement, contre));
  const appuyer = () => {
    if (!reduit) {
      Animated.sequence([
        Animated.timing(ecrasement, { toValue: 0.9, duration: 70, useNativeDriver: false, isInteraction: false }),
        Animated.spring(ecrasement, { toValue: 1, friction: 3, tension: 160, useNativeDriver: false, isInteraction: false }),
      ]).start();
    }
    onAppui();
  };
  // Les lieux plus bas sur la carte passent devant ceux du dessus ; le lieu ouvert, devant tous.
  const profondeur = Math.round(y / 10) + (ouvert ? 1000 : 0);
  return (
    <Animated.View
      style={[styles.lieuConteneur, { left: x - LIEU.largeur / 2, top: y - LIEU.hauteur / 2, zIndex: profondeur, transform: [{ scale: echelle }] }]}
    >
      <Pressable style={styles.lieu} onPress={appuyer} accessibilityRole="button" accessibilityLabel={pastille ? `${titre} : ${pastille}` : titre}>
        <View style={[styles.ombre, ouvert ? styles.ombreOuverte : null]} />
        <Text style={styles.batiment} accessibilityElementsHidden importantForAccessibility="no">
          {principal}
        </Text>
        <Text style={styles.compagnons} accessibilityElementsHidden importantForAccessibility="no">
          {compagnons}
        </Text>
        <View style={[styles.pancarteLieu, ouvert ? styles.pancarteOuverte : null]}>
          <Text style={styles.titreLieu} numberOfLines={2}>
            {titre}
          </Text>
        </View>
      </Pressable>
      {pastille ? (
        <View style={styles.bulleAttente} pointerEvents="none">
          <Pulsation actif>
            <View style={styles.bulleAttenteCorps}>
              <Text style={styles.pastilleTexte}>{pastille}</Text>
            </View>
          </Pulsation>
          <View style={styles.bulleAttenteQueue} />
        </View>
      ) : null}
    </Animated.View>
  );
}

/** Les nuages qui passent sur la carte : leur hauteur, leur taille, le temps qu'ils mettent à la traverser, et où ils en sont au départ. */
const NUAGES = [
  { y: 150, taille: 64, duree: 140000, depart: 0.1 },
  { y: 520, taille: 48, duree: 190000, depart: 0.45 },
  { y: 900, taille: 72, duree: 160000, depart: 0.7 },
  { y: 1250, taille: 52, duree: 210000, depart: 0.3 },
] as const;

/** La stèle près de l'enclos : l'équarrissage sur l'exploitation, avec les animaux morts de l'année. Un appui ouvre la page de l'équarrissage. */
function LaStele({ morts }: { morts: number }) {
  const router = useRouter();
  const titre = T.zones.equarrissage;
  const pastille = morts > 0 ? T.zones.morts(morts) : undefined;
  return (
    <Pressable
      style={[styles.stele, { left: STELE.x, top: STELE.y, width: STELE.largeur, height: STELE.hauteur }]}
      onPress={() => router.push(ROUTES.lieu('equarrissage') as never)}
      accessibilityRole="button"
      accessibilityLabel={pastille ? `${titre} : ${pastille}` : titre}
    >
      <Text style={styles.steleEmoji} accessibilityElementsHidden importantForAccessibility="no">
        🪦
      </Text>
      {pastille ? <Text style={styles.steleTexte}>{pastille}</Text> : null}
    </Pressable>
  );
}

/** Ce que le navigateur sait faire d'un élément (la molette de la souris) : le strict nécessaire, sans les types du navigateur. */
interface NoeudWeb {
  addEventListener?: (type: string, ecouteur: (e: { deltaY: number; preventDefault: () => void }) => void, options?: { passive: boolean }) => void;
  removeEventListener?: (type: string, ecouteur: (e: { deltaY: number; preventDefault: () => void }) => void) => void;
}

/**
 * La carte de la ferme, vue en perspective : une grande pelouse inclinée (le fond plus petit), des routes grises, l'enclos au centre et les
 * lieux (aliments, laiterie, fromagerie, boucherie, abattoir, vétérinaire, clients…) au bout des routes, avec les camions du lait et du foin
 * qui passent. On la fait glisser du doigt (sur ordinateur, bouton de la souris enfoncé) et on zoome à deux doigts, à la molette ou aux
 * boutons ; un bouton montre toute l'exploitation d'un coup d'œil. Un appui sur un lieu fait sortir ses bulles d'actions.
 */
export function CarteFerme({ vedettes, nombreAnimaux, naissances, lotsAFacturer, lotsARappeler, morts, estive, aliments }: Props) {
  const router = useRouter();
  const reduit = useMouvementReduit();
  const [x] = useState(() => new Animated.Value(0));
  const [y] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(1));
  // Ce que la main sait de la carte : la taille de la vue, la position et le zoom actuels, d'où le doigt est parti, le pincement en cours.
  const etat = useRef({
    largeur: 0,
    hauteur: 0,
    x: 0,
    y: 0,
    zoom: 1,
    fit: 0.2,
    departX: 0,
    departY: 0,
    pincement: null as { distance: number; zoom: number } | null,
    aPince: false,
  });
  const vueRef = useRef<View>(null);
  const [dim, setDim] = useState<{ largeur: number; hauteur: number } | null>(null);
  const [fit, setFit] = useState(0.2);
  const [aideVisible, setAideVisible] = useState(true);
  const [apercu, setApercu] = useState(false);
  // Dans la chèvrerie : un autre décor remplace la carte.
  const [interieur, setInterieur] = useState(false);
  const [ouvert, setOuvert] = useState<CibleDesBulles | null>(null);
  const [arbres] = useState(() => [...montagnes(), ...decor()]);

  useEffect(() => {
    const ix = x.addListener(({ value }) => {
      etat.current.x = value;
    });
    const iy = y.addListener(({ value }) => {
      etat.current.y = value;
    });
    const iz = zoom.addListener(({ value }) => {
      etat.current.zoom = value;
    });
    return () => {
      x.removeListener(ix);
      y.removeListener(iy);
      zoom.removeListener(iz);
    };
  }, [x, y, zoom]);

  /** Les bornes du glissement à un zoom donné : la carte reste dans ses bords, centrée quand elle est plus petite que la vue. */
  const bornesA = (z: number) => ({
    x: bornes(etat.current.largeur, CARTE.largeur * z),
    y: bornesEnPerspective(etat.current.hauteur, CARTE.hauteur * z),
  });
  /** La position qui met le point (cx, cy) de la carte au milieu de la vue, au zoom z. */
  const positionPour = (cx: number, cy: number, z: number) => {
    const b = bornesA(z);
    return { x: borner(etat.current.largeur / 2 - cx * z, b.x), y: borner(etat.current.hauteur * FOYER_VERTICAL - cy * z, b.y) };
  };
  /** Pose zoom et position tout de suite, ou en glissant (`duree` en ms). */
  const aller = (cible: { x: number; y: number; zoom: number }, duree: number) => {
    if (reduit || duree === 0) {
      x.setValue(cible.x);
      y.setValue(cible.y);
      zoom.setValue(cible.zoom);
      return;
    }
    const regle = { duration: duree, easing: Easing.inOut(Easing.cubic), useNativeDriver: false, isInteraction: false };
    Animated.parallel([
      Animated.timing(x, { toValue: cible.x, ...regle }),
      Animated.timing(y, { toValue: cible.y, ...regle }),
      Animated.timing(zoom, { toValue: cible.zoom, ...regle }),
    ]).start();
  };
  /** Change le zoom en gardant le milieu de la vue en place. */
  const zoomerA = (nouveau: number, duree = 0) => {
    const z = Math.min(ZOOM_MAX, Math.max(etat.current.fit, nouveau));
    const e = etat.current;
    // Le point de la carte au milieu de la vue avant le zoom.
    const cx = (e.largeur / 2 - e.x) / e.zoom;
    const cy = (e.hauteur * FOYER_VERTICAL - e.y) / e.zoom;
    aller({ ...positionPour(cx, cy, z), zoom: z }, duree);
  };

  // Le geste ne lit `etat` que quand le doigt bouge, jamais pendant l'affichage : le lint ne peut pas le voir.
  // eslint-disable-next-line react-hooks/refs
  const [mains] = useState(() =>
    PanResponder.create({
      // Dès que le doigt a bougé de quelques points (ou qu'un second se pose), la carte prend la main : un appui court sur un lieu l'ouvre toujours.
      onMoveShouldSetPanResponderCapture: (e, g) => e.nativeEvent.touches.length >= 2 || Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        x.stopAnimation();
        y.stopAnimation();
        zoom.stopAnimation();
        etat.current.departX = etat.current.x;
        etat.current.departY = etat.current.y;
        etat.current.pincement = null;
        etat.current.aPince = false;
        setAideVisible(false);
        setOuvert(null);
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        const m = etat.current;
        if (touches.length >= 2) {
          // Deux doigts : la distance qui change fait le zoom.
          const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (!m.pincement) m.pincement = { distance: Math.max(distance, 1), zoom: m.zoom };
          m.aPince = true;
          const z = Math.min(ZOOM_MAX, Math.max(m.fit, (m.pincement.zoom * distance) / m.pincement.distance));
          const cx = (m.largeur / 2 - m.x) / m.zoom;
          const cy = (m.hauteur * FOYER_VERTICAL - m.y) / m.zoom;
          const b = { x: bornes(m.largeur, CARTE.largeur * z), y: bornesEnPerspective(m.hauteur, CARTE.hauteur * z) };
          zoom.setValue(z);
          x.setValue(borner(m.largeur / 2 - cx * z, b.x));
          y.setValue(borner(m.hauteur * FOYER_VERTICAL - cy * z, b.y));
          return;
        }
        if (m.pincement) {
          // Un doigt se lève : on reprend le glissement de là où la carte est.
          m.pincement = null;
          m.departX = m.x - g.dx;
          m.departY = m.y - g.dy;
        }
        const b = { x: bornes(m.largeur, CARTE.largeur * m.zoom), y: bornesEnPerspective(m.hauteur, CARTE.hauteur * m.zoom) };
        x.setValue(borner(m.departX + g.dx, b.x));
        y.setValue(borner(m.departY + g.dy, b.y));
      },
      onPanResponderRelease: (_e, g) => {
        const m = etat.current;
        m.pincement = null;
        if (m.aPince) return;
        const b = { x: bornes(m.largeur, CARTE.largeur * m.zoom), y: bornesEnPerspective(m.hauteur, CARTE.hauteur * m.zoom) };
        // Elle glisse encore un peu dans le sens du geste, sans dépasser ses bords.
        const cibleX = borner(m.x + g.vx * 320, b.x);
        const cibleY = borner(m.y + g.vy * 320, b.y);
        if (cibleX === m.x && cibleY === m.y) return;
        Animated.parallel([
          Animated.timing(x, { toValue: cibleX, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false, isInteraction: false }),
          Animated.timing(y, { toValue: cibleY, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false, isInteraction: false }),
        ]).start();
      },
    }),
  );

  // La molette de la souris (sur ordinateur) zoome aussi : un cran de plus ou de moins.
  useEffect(() => {
    const noeud = vueRef.current as unknown as NoeudWeb | null;
    if (!noeud?.addEventListener) return;
    const ecouteur = (e: { deltaY: number; preventDefault: () => void }) => {
      e.preventDefault();
      setApercu(false);
      zoomerA(etat.current.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    };
    noeud.addEventListener('wheel', ecouteur, { passive: false });
    return () => noeud.removeEventListener?.('wheel', ecouteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** À la mesure de la vue (et à chaque changement de taille de la fenêtre) : la carte se centre la première fois, sinon reste dans ses bords. */
  const mesurer = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const premiere = etat.current.largeur === 0;
    etat.current.largeur = width;
    etat.current.hauteur = height;
    // Les colonnes de boutons cachent environ 80 points de chaque côté : la vue d'ensemble tient entre elles.
    etat.current.fit = echelleVueDEnsemble(width - 170, height);
    setFit(etat.current.fit);
    setDim({ largeur: width, hauteur: height });
    if (premiere) {
      const p = positionPour(CENTRE.x, CENTRE.y, 1);
      x.setValue(p.x);
      y.setValue(p.y);
    } else {
      const b = bornesA(etat.current.zoom);
      x.setValue(borner(etat.current.x, b.x));
      y.setValue(borner(etat.current.y, b.y));
    }
  };

  const recentrer = () => {
    setApercu(false);
    setOuvert(null);
    aller({ ...positionPour(CENTRE.x, CENTRE.y, 1), zoom: 1 }, 600);
  };
  /** Toute l'exploitation d'un coup d'œil, puis le retour de près au centre. */
  const basculerApercu = () => {
    setOuvert(null);
    if (apercu) {
      recentrer();
      return;
    }
    setApercu(true);
    aller({ ...positionPour(CENTRE.x, CENTRE.y, etat.current.fit), zoom: etat.current.fit }, 700);
  };
  /** En vue d'ensemble, un appui sur un lieu s'en approche. */
  const zoomerSur = (cx: number, cy: number) => {
    setApercu(false);
    aller({ ...positionPour(cx, cy, 1), zoom: 1 }, 700);
  };

  // Un lieu : en vue d'ensemble, on s'en approche ; sinon ses bulles sortent, et un second appui ouvre sa page.
  const appuiLieu = (cle: CleLieu, cx: number, cy: number) => {
    if (apercu) {
      zoomerSur(cx, cy);
      return;
    }
    if (ouvert === cle) {
      setOuvert(null);
      router.push(ROUTE_DU_LIEU[cle] as never);
      return;
    }
    if (actionsDuLieu(cle).length === 0) router.push(ROUTE_DU_LIEU[cle] as never);
    else setOuvert(cle);
  };
  const appuiEnclos = () => {
    if (apercu) {
      zoomerSur(CENTRE.x, CENTRE.y);
      return;
    }
    if (ouvert === 'enclos') {
      setOuvert(null);
      router.push(ROUTES.CHEPTEL as never);
      return;
    }
    setOuvert('enclos');
  };
  const choisir = (action: ActionDeLieu) => {
    setOuvert(null);
    router.push(action.route as never);
  };
  const centreDes = (cible: CibleDesBulles) => {
    if (cible === 'enclos') return CENTRE;
    const lieu = LIEUX.find((l) => l.cle === cible);
    return lieu ? { x: lieu.x, y: lieu.y } : CENTRE;
  };

  const titres: Record<CleLieu, string> = {
    foin: T.zones.foin,
    organismes: T.zones.organismes,
    equarrissage: T.zones.equarrissage,
    pompe: T.zones.pompe,
    entrepot: T.zones.entrepot,
    commercial: T.zones.commercial,
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

  // En vue d'ensemble, les lieux grossissent pour rester lisibles (jusqu'à 3,4 fois) ; de près, ils gardent leur taille.
  const fitSur = Math.min(fit, 0.99);
  const contre = zoom.interpolate({ inputRange: [fitSur, 1], outputRange: [Math.min(1 / fitSur, 3.4), 1], extrapolate: 'clamp' });

  // Le plan incliné est plus grand que la vue (son bord proche en bas) : la carte glisse dessus, comme un sol vu de biais.
  const planL = dim ? dim.largeur * 2.2 : 0;
  const planH = dim ? dim.hauteur * 1.9 : 0;

  if (interieur) return <ChevrerieInterieure vedettes={vedettes} aliments={aliments} onSortir={() => setInterieur(false)} />;

  return (
    <View ref={vueRef} style={styles.vue} onLayout={mesurer} {...mains.panHandlers}>
      {dim ? (
        <View
          style={[
            styles.plan,
            {
              width: planL,
              height: planH,
              left: -(planL - dim.largeur) / 2,
              top: dim.hauteur - planH,
              transform: [{ perspective: PERSPECTIVE }, { rotateX: INCLINAISON }],
              transformOrigin: '50% 100%',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.carte,
              {
                width: CARTE.largeur,
                height: CARTE.hauteur,
                transformOrigin: '0% 0%',
                transform: [
                  { translateX: Animated.add(x, (planL - dim.largeur) / 2) },
                  { translateY: Animated.add(y, planH - dim.hauteur) },
                  { scale: zoom },
                ],
              },
            ]}
          >
            {arbres.map((a, i) => (
              <Text key={i} style={[styles.decor, { left: a.x, top: a.y, fontSize: a.taille }]} accessibilityElementsHidden importantForAccessibility="no">
                {a.emoji}
              </Text>
            ))}
            {/* La ferme : le domaine clôturé où tout se passe, avec sa pancarte de bienvenue à la porte. */}
            <View style={[styles.ferme, { left: FERME.x, top: FERME.y, width: FERME.largeur, height: FERME.hauteur }]} pointerEvents="none" />
            <View style={[styles.pancarte, { left: ENTREE.x - 70, top: ENTREE.y - 34 }]} pointerEvents="none">
              <Text style={styles.pancarteEmoji}>🪧</Text>
              <Text style={styles.pancarteTexte}>{T.carte.bienvenue}</Text>
            </View>
            {ROUTES_GRISES.map((r, i) => (
              <View key={i} style={[styles.route, { left: r.x, top: r.y, width: r.largeur, height: r.hauteur }]} />
            ))}
            {/* Le tracteur fait l'aller-retour sur la route sud, devant l'enclos. */}
            <View style={[styles.vehicule, { left: CENTRE.x - 390, top: CENTRE.y + 170 - 40 }]} pointerEvents="none">
              <AllerRetour de={0} vers={780} duree={30000}>
                <Text style={styles.vehiculeEmoji}>🚜</Text>
              </AllerRetour>
            </View>
            <View style={{ position: 'absolute', left: CENTRE.x - ENCLOS.largeur / 2, top: CENTRE.y - ENCLOS.hauteur / 2, width: ENCLOS.largeur, height: ENCLOS.hauteur, zIndex: ouvert === 'enclos' ? 5 : 1 }}>
              <EnclosFerme
                vedettes={vedettes}
                nombreAnimaux={nombreAnimaux}
                naissances={naissances}
                estive={estive}
                onAppui={appuiEnclos}
                onEntrer={() => {
                  setOuvert(null);
                  setInterieur(true);
                }}
              />
            </View>
            {LIEUX.map((l) => (
              <LieuDeLaCarte
                key={l.cle}
                principal={l.principal}
                compagnons={l.compagnons}
                titre={titres[l.cle]}
                pastille={pastilles[l.cle]}
                x={l.x}
                y={l.y}
                ouvert={ouvert === l.cle}
                contre={contre}
                onAppui={() => appuiLieu(l.cle, l.x, l.y)}
              />
            ))}
            {/* Le récolteur du lait arrive devant la laiterie, le livreur de foin devant le foin : des camions vivants sur la route nord, leur bulle dit ce qu'ils font là. */}
            <View style={{ position: 'absolute', left: CENTRE.x + 170 - 22, top: CENTRE.y - 170 - 70, zIndex: 60 }}>
              <CamionVivant emoji="🚚" bulle="🥛" axe="x" depart={300} libelle={T.carte.recolteur} onAppui={() => router.push(ROUTES.PRODUCTION_LAITERIE as never)} />
            </View>
            <View style={{ position: 'absolute', left: CENTRE.x - 22, top: CENTRE.y - 170 - 70, zIndex: 60 }}>
              <CamionVivant emoji="🚛" bulle="🌾" axe="x" depart={-300} libelle={T.carte.livreur} delai={9000} onAppui={() => router.push(ROUTES.lieu('aliments') as never)} />
            </View>
            <LaStele morts={morts} />
            {NUAGES.map((n, i) => (
              <View key={i} style={[styles.nuage, { left: 0, top: n.y }]} pointerEvents="none">
                <Derive de={-120} vers={CARTE.largeur + 60} duree={n.duree} depart={n.depart}>
                  <Text style={{ fontSize: n.taille, opacity: 0.8 }}>☁️</Text>
                </Derive>
              </View>
            ))}
            {/* Les bulles d'actions du lieu ouvert, par-dessus tout ; un appui à côté les referme. */}
            {ouvert ? (
              <>
                <Pressable style={styles.fondDesBulles} onPress={() => setOuvert(null)} accessibilityLabel={T.carte.recentrer} />
                <View style={styles.couchedesBulles} pointerEvents="box-none">
                  <BullesLieu x={centreDes(ouvert).x} y={centreDes(ouvert).y} actions={actionsDuLieu(ouvert)} onChoisir={choisir} />
                </View>
              </>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
      {/* La brume du lointain : le haut de l'écran s'éclaircit, la carte se perd dans l'horizon. */}
      <View style={styles.brume} pointerEvents="none" />
      {aideVisible ? (
        <View style={styles.aide} pointerEvents="none">
          <Text style={styles.aideTexte}>{T.carte.aide}</Text>
        </View>
      ) : null}
      <View style={styles.boutons} pointerEvents="box-none">
        <Pressable style={styles.bouton} onPress={() => zoomerA(etat.current.zoom / 1.35, 250)} accessibilityRole="button" accessibilityLabel="−">
          <Ionicons name="remove" size={22} color={colors.blanc} />
        </Pressable>
        <Pressable style={styles.bouton} onPress={() => zoomerA(etat.current.zoom * 1.35, 250)} accessibilityRole="button" accessibilityLabel="+">
          <Ionicons name="add" size={22} color={colors.blanc} />
        </Pressable>
        <Pressable style={styles.bouton} onPress={recentrer} accessibilityRole="button" accessibilityLabel={T.carte.recentrer}>
          <Ionicons name="locate" size={22} color={colors.blanc} />
        </Pressable>
        <Pressable style={[styles.bouton, apercu ? styles.boutonActif : null]} onPress={basculerApercu} accessibilityRole="button" accessibilityLabel={apercu ? T.carte.retourDeLApercu : T.carte.apercu}>
          <Ionicons name={apercu ? 'contract' : 'expand'} size={22} color={colors.blanc} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  vue: { flex: 1, overflow: 'hidden', backgroundColor: '#CFE7F5', userSelect: 'none' },
  plan: { position: 'absolute', backgroundColor: SOL },
  carte: { position: 'absolute', left: 0, top: 0, backgroundColor: SOL },
  decor: { position: 'absolute' },
  route: { position: 'absolute', backgroundColor: '#B4B4AC', borderRadius: 6, borderWidth: 2, borderColor: '#8E8E86' },
  lieuConteneur: { position: 'absolute', width: LIEU.largeur, height: LIEU.hauteur },
  lieu: { width: LIEU.largeur, height: LIEU.hauteur, alignItems: 'center', justifyContent: 'flex-end' },
  // L'ombre au sol, sous le bâtiment.
  ombre: { position: 'absolute', bottom: 18, width: 104, height: 24, borderRadius: 52, backgroundColor: 'rgba(40,60,20,0.28)' },
  ombreOuverte: { backgroundColor: 'rgba(232,137,43,0.55)' },
  batiment: { position: 'absolute', top: 0, fontSize: 76, textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 3, height: 4 }, textShadowRadius: 4 },
  compagnons: { position: 'absolute', bottom: 20, right: 6, fontSize: 28 },
  // La pancarte de bois du nom, plantée devant le bâtiment.
  pancarteLieu: { backgroundColor: '#B07A3E', borderRadius: 8, borderWidth: 2, borderColor: '#6F4A25', paddingHorizontal: 8, paddingVertical: 1, maxWidth: LIEU.largeur + 24 },
  pancarteOuverte: { backgroundColor: '#E8892B', borderColor: '#8E3A12' },
  ferme: { position: 'absolute', backgroundColor: 'rgba(214,236,168,0.55)', borderWidth: 7, borderColor: '#A9794A', borderRadius: 26 },
  pancarte: { position: 'absolute', width: 140, alignItems: 'center' },
  pancarteEmoji: { fontSize: 30 },
  pancarteTexte: { fontSize: 12, fontWeight: '800', color: '#5B3A12', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 1, overflow: 'hidden' },
  titreLieu: { fontSize: 12, fontWeight: '800', color: colors.blanc, textAlign: 'center' },
  bulleAttente: { position: 'absolute', top: -34, left: 0, right: 0, alignItems: 'center' },
  bulleAttenteCorps: { backgroundColor: colors.blanc, borderRadius: 12, borderWidth: 2, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 3 },
  bulleAttenteQueue: { width: 10, height: 10, backgroundColor: colors.blanc, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.border, transform: [{ rotate: '45deg' }], marginTop: -6 },
  pastilleTexte: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  fondDesBulles: { position: 'absolute', left: 0, top: 0, width: CARTE.largeur, height: CARTE.hauteur, zIndex: 900 },
  couchedesBulles: { position: 'absolute', left: 0, top: 0, width: CARTE.largeur, height: CARTE.hauteur, zIndex: 2000 },
  brume: { position: 'absolute', left: 0, right: 0, top: 0, height: 70, backgroundColor: 'rgba(207,231,245,0.35)' },
  aide: { position: 'absolute', bottom: 62, left: 0, right: 0, alignItems: 'center' },
  aideTexte: { backgroundColor: 'rgba(0,0,0,0.55)', color: colors.blanc, fontSize: 13, fontWeight: '600', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, overflow: 'hidden' },
  vehicule: { position: 'absolute', width: 60, height: 44 },
  vehiculeEmoji: { fontSize: 34 },
  nuage: { position: 'absolute', width: 40, height: 80 },
  stele: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  steleEmoji: { fontSize: 32 },
  steleTexte: { fontSize: 10, fontWeight: '700', color: colors.danger, textAlign: 'center' },
  boutons: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  bouton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.blanc, alignItems: 'center', justifyContent: 'center' },
  boutonActif: { backgroundColor: colors.accent },
});
