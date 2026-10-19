/**
 * La carte de la ferme : une grande pelouse que l'on fait glisser du doigt, avec des routes grises vers les lieux (aliments, pompe à
 * essence, vétérinaire, organismes, laiterie, fromagerie, boucherie, abattoir, équarrissage, clients). Ici seulement la géométrie, sans
 * rien d'affichage : les positions sont en points, depuis le coin en haut à gauche de la carte.
 */

export const CARTE = { largeur: 1500, hauteur: 1400 } as const;

/** Le centre de la carte : l'enclos y est posé, les lieux serrés autour de lui. */
export const CENTRE = { x: 750, y: 720 } as const;

/** L'enclos du troupeau, au centre. */
export const ENCLOS = { largeur: 260, hauteur: 230 } as const;

/** La place d'un lieu sur la carte : le bâtiment dessiné, ses compagnons à ses pieds, et la pancarte de son nom. */
export const LIEU = { largeur: 140, hauteur: 118, profondeur: 0 } as const;

export type CleLieu =
  | 'foin'
  | 'organismes'
  | 'laiterie'
  | 'fromagerie'
  | 'charcuterie'
  | 'abattoir'
  | 'equarrissage'
  | 'veterinaire'
  | 'contacts'
  | 'pompe'
  | 'entrepot'
  | 'commercial';

export interface Lieu {
  cle: CleLieu;
  /** Son bâtiment, dessiné en grand (un emoji de maison, d'usine, d'hôpital… remplaçable par une illustration). */
  principal: string;
  /** Ce qui l'accompagne à ses pieds : ses produits, son matériel. */
  compagnons: string;
  /** Le centre du lieu sur la carte. */
  x: number;
  y: number;
}

/** Un lieu placé à (dx, dy) du centre de la carte. */
const lieu = (cle: CleLieu, principal: string, compagnons: string, dx: number, dy: number): Lieu => ({
  cle,
  principal,
  compagnons,
  x: CENTRE.x + dx,
  y: CENTRE.y + dy,
});

/**
 * Les lieux de la carte : un village serré, comme dans un jeu de ferme. Trois rangées autour de l'enclos : en haut la pompe, les organismes,
 * le foin et le maïs, la laiterie et l'entrepôt ; sur les côtés le vétérinaire et la fromagerie ; en bas le commerce, les clients, l'abattoir,
 * la boucherie et l'équarrissage.
 */
export const LIEUX: readonly Lieu[] = [
  lieu('pompe', '⛽', '🛢️', -340, -255),
  lieu('organismes', '🏛️', '📄', -170, -255),
  lieu('foin', '🛖', '🌾🌽', 0, -255),
  lieu('laiterie', '🏡', '🥛🐄', 170, -255),
  lieu('entrepot', '🏢', '📦', 340, -255),
  lieu('veterinaire', '🏥', '🩺', -300, 0),
  lieu('fromagerie', '🏠', '🧀', 300, 0),
  lieu('commercial', '🏬', '🛒', -340, 255),
  lieu('contacts', '🏘️', '🤝', -170, 255),
  lieu('abattoir', '🏭', '🥩', 0, 255),
  lieu('charcuterie', '🏪', '🥓🥩', 170, 255),
  lieu('equarrissage', '🏚️', '🚛', 340, 255),
];

/** Le petit coin de l'équarrissage sur l'exploitation, à côté de l'enclos : une stèle, avec les animaux morts de l'année. */
export const STELE = { x: CENTRE.x + 134, y: CENTRE.y + 40, largeur: 64, hauteur: 64 } as const;

/**
 * La ferme : le domaine clôturé où tout se passe (l'enclos, les bâtiments, les chemins). Hors de la clôture, la campagne : arbres, fleurs et
 * montagnes. Sa porte, avec la pancarte de bienvenue, est au milieu du côté sud.
 */
export const FERME = { x: CENTRE.x - 440, y: CENTRE.y - 385, largeur: 880, hauteur: 745 } as const;
export const ENTREE = { x: CENTRE.x, y: FERME.y + FERME.hauteur } as const;

export interface Rect {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** L'épaisseur d'une route. */
const R = 24;

/** Un segment de route centré sur la ligne `x` (vertical, de `y1` à `y2`). */
const verticale = (x: number, y1: number, y2: number): Rect => ({ x: x - R / 2, y: Math.min(y1, y2), largeur: R, hauteur: Math.abs(y2 - y1) });
/** Un segment de route centré sur la ligne `y` (horizontal, de `x1` à `x2`). */
const horizontale = (y: number, x1: number, x2: number): Rect => ({ x: Math.min(x1, x2), y: y - R / 2, largeur: Math.abs(x2 - x1), hauteur: R });

/** Le bord bas d'un lieu de la rangée du haut (là où part son chemin), et le bord haut d'un lieu de la rangée du bas. */
const BAS_RANGEE_HAUTE = -255 + LIEU.hauteur / 2;
const HAUT_RANGEE_BASSE = 255 - LIEU.hauteur / 2;
/** Les deux routes qui longent l'enclos, au nord et au sud. */
const ROUTE_NORD = -170;
const ROUTE_SUD = 170;

/**
 * Les routes grises : une boucle autour de l'enclos (deux routes, nord et sud, et deux côtés), un chemin court devant chaque lieu, et deux
 * bras vers le vétérinaire et la fromagerie. Tout est à portée de la main.
 */
export const ROUTES_GRISES: readonly Rect[] = [
  horizontale(CENTRE.y + ROUTE_NORD, CENTRE.x - 400, CENTRE.x + 400),
  horizontale(CENTRE.y + ROUTE_SUD, CENTRE.x - 400, CENTRE.x + 400),
  verticale(CENTRE.x - 215, CENTRE.y + ROUTE_NORD, CENTRE.y + ROUTE_SUD),
  verticale(CENTRE.x + 215, CENTRE.y + ROUTE_NORD, CENTRE.y + ROUTE_SUD),
  horizontale(CENTRE.y, CENTRE.x - 300, CENTRE.x - 215),
  horizontale(CENTRE.y, CENTRE.x + 215, CENTRE.x + 300),
  // Les chemins qui relient chaque lieu de la rangée du haut à la route nord, et chaque lieu de la rangée du bas à la route sud.
  ...[-340, -170, 0, 170, 340].flatMap((dx) => [
    verticale(CENTRE.x + dx, CENTRE.y + BAS_RANGEE_HAUTE, CENTRE.y + ROUTE_NORD),
    verticale(CENTRE.x + dx, CENTRE.y + ROUTE_SUD, CENTRE.y + HAUT_RANGEE_BASSE),
  ]),
];

/** Les bornes du décalage de la carte pour une vue de `vue` points : la carte ne laisse jamais voir au-delà de ses bords (centrée si elle est plus petite). */
export function bornes(vue: number, carte: number): { min: number; max: number } {
  if (carte <= vue) return { min: (vue - carte) / 2, max: (vue - carte) / 2 };
  return { min: vue - carte, max: 0 };
}

/** Ramène un décalage dans ses bornes. */
export const borner = (valeur: number, b: { min: number; max: number }): number => Math.min(b.max, Math.max(b.min, valeur));

/** Le décalage qui met le point `centre` de la carte au milieu d'une vue de `vue` points. */
export const centrerSur = (centre: number, vue: number, carte: number): number => borner(vue / 2 - centre, bornes(vue, carte));

/** Le rectangle d'un lieu (ou de l'enclos) sur la carte. */
export const rectDuLieu = (l: Pick<Lieu, 'x' | 'y'>): Rect => ({
  x: l.x - LIEU.largeur / 2,
  y: l.y - LIEU.hauteur / 2 - LIEU.profondeur,
  largeur: LIEU.largeur + LIEU.profondeur,
  hauteur: LIEU.hauteur + LIEU.profondeur,
});
export const rectDeLEnclos = (): Rect => ({ x: CENTRE.x - ENCLOS.largeur / 2, y: CENTRE.y - ENCLOS.hauteur / 2, largeur: ENCLOS.largeur, hauteur: ENCLOS.hauteur });
export const rectDeLaStele = (): Rect => ({ x: STELE.x, y: STELE.y, largeur: STELE.largeur, hauteur: STELE.hauteur });

const seDeborde = (a: Rect, b: Rect, marge: number): boolean =>
  a.x < b.x + b.largeur + marge && a.x + a.largeur > b.x - marge && a.y < b.y + b.hauteur + marge && a.y + a.hauteur > b.y - marge;

export interface ElementDeDecor {
  emoji: string;
  x: number;
  y: number;
  taille: number;
}

/** Les montagnes du bord nord de la carte : une chaîne qui ferme l'horizon. */
export function montagnes(): ElementDeDecor[] {
  const elements: ElementDeDecor[] = [];
  for (let x = -10, i = 0; x < CARTE.largeur; x += 110, i++) {
    elements.push({ emoji: i % 3 === 1 ? '⛰️' : '🏔️', x, y: 6, taille: 60 + (i % 2) * 8 });
  }
  return elements;
}

/**
 * Le décor de la campagne : des arbres et des fleurs semés au hasard (toujours les mêmes, la graine est fixe), tout autour de la ferme
 * (jamais dans son domaine clôturé ni sur ses routes), sous la chaîne de montagnes.
 */
export function decor(): ElementDeDecor[] {
  let graine = 20260;
  const alea = () => {
    graine = (graine * 1103515245 + 12345) % 2147483648;
    return graine / 2147483648;
  };
  const interdits = [...ROUTES_GRISES, ...LIEUX.map(rectDuLieu), rectDeLEnclos(), rectDeLaStele(), { x: FERME.x, y: FERME.y, largeur: FERME.largeur, hauteur: FERME.hauteur + 70 }];
  const emojis = ['🌳', '🌲', '🌳', '🌼', '🌻', '🌳'];
  const elements: ElementDeDecor[] = [];
  for (let i = 0; i < 520 && elements.length < 90; i++) {
    const taille = 28 + Math.round(alea() * 16);
    const x = 30 + alea() * (CARTE.largeur - 100);
    const y = 100 + alea() * (CARTE.hauteur - 170);
    const boite = { x, y, largeur: taille, hauteur: taille };
    if (interdits.some((r) => seDeborde(boite, r, 24))) continue;
    elements.push({ emoji: emojis[Math.floor(alea() * emojis.length)], x, y, taille });
  }
  return elements;
}

/**
 * Les centres des `n` bulles d'actions d'un lieu, en éventail au-dessus de lui (de la gauche vers la droite) à `rayon` points de son
 * centre ; une seule bulle se met droit au-dessus. Les positions sont relatives au centre du lieu : `x` vers la droite, `y` vers le bas.
 */
export function positionsEnEventail(n: number, rayon: number): { x: number; y: number }[] {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 0, y: -rayon }];
  // De 160° à 20° (au-dessus de l'horizontale) : un éventail de 140°, de la gauche vers la droite.
  return Array.from({ length: n }, (_, i) => {
    const angle = ((160 - (140 * i) / (n - 1)) * Math.PI) / 180;
    return { x: Math.round(rayon * Math.cos(angle)), y: -Math.round(rayon * Math.sin(angle)) };
  });
}

/** La part de la hauteur de la vue qu'il faut laisser au nord : en perspective, le haut de la carte paraît plus bas que sa vraie position. */
export const MARGE_EN_PERSPECTIVE = 0.25;

/**
 * Les bornes du décalage vertical de la carte en perspective : en bas, la carte touche le bord de la vue ; en haut, elle peut monter de
 * `MARGE_EN_PERSPECTIVE` fois la vue, pour que son bord nord atteigne le haut de l'écran malgré l'éloignement. Centrée quand elle est plus petite.
 */
export function bornesEnPerspective(vue: number, carte: number): { min: number; max: number } {
  const marge = vue * MARGE_EN_PERSPECTIVE;
  if (carte <= vue + marge) return { min: (vue - carte) / 2, max: (vue - carte) / 2 };
  return { min: vue - carte, max: -marge };
}

/** L'échelle qui fait tenir toute la carte dans la vue (la vue d'ensemble) : sa largeur, et sa hauteur un peu réduite par la perspective. */
export const echelleVueDEnsemble = (largeur: number, hauteur: number): number =>
  Math.min(1, Math.max(0.05, Math.min(largeur / CARTE.largeur, hauteur / (CARTE.hauteur * 0.88)) * 0.96));
