/**
 * La carte de la ferme : une grande pelouse que l'on fait glisser du doigt, avec des routes grises vers les lieux (aliments, pompe à
 * essence, vétérinaire, organismes, laiterie, fromagerie, boucherie, abattoir, équarrissage, clients). Ici seulement la géométrie, sans
 * rien d'affichage : les positions sont en points, depuis le coin en haut à gauche de la carte.
 */

export const CARTE = { largeur: 2000, hauteur: 2100 } as const;

/** Le centre de la carte : l'enclos y est posé, d'où partent les routes. */
export const CENTRE = { x: 1000, y: 1050 } as const;

/** L'enclos du troupeau, au centre. */
export const ENCLOS = { largeur: 260, hauteur: 230 } as const;

/** La taille d'un lieu (sa carte cliquable). */
export const LIEU = { largeur: 140, hauteur: 116 } as const;

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
  | 'pompe';

export interface Lieu {
  cle: CleLieu;
  /** Son dessin (un emoji, remplaçable par une illustration). */
  emoji: string;
  /** Le centre du lieu sur la carte. */
  x: number;
  y: number;
}

/** Un lieu placé à (dx, dy) du centre de la carte. */
const lieu = (cle: CleLieu, emoji: string, dx: number, dy: number): Lieu => ({ cle, emoji, x: CENTRE.x + dx, y: CENTRE.y + dy });

/** Les lieux de la carte, tout autour de l'enclos, chacun au bout d'une route. */
export const LIEUX: readonly Lieu[] = [
  lieu('foin', '🌾🌽', 0, -520),
  lieu('organismes', '🏛️', 0, -900),
  lieu('laiterie', '🥛', 520, -340),
  lieu('fromagerie', '🧀', 560, 0),
  lieu('charcuterie', '🥩', 520, 340),
  lieu('abattoir', '🏭', 0, 520),
  lieu('equarrissage', '🚛', 0, 900),
  lieu('contacts', '🤝', -520, 340),
  lieu('veterinaire', '🩺', -560, 0),
  lieu('pompe', '⛽', -520, -340),
];

/** Le petit coin de l'équarrissage sur l'exploitation, à côté de l'enclos : une stèle, avec les animaux morts de l'année. */
export const STELE = { x: CENTRE.x + 175, y: CENTRE.y + 55, largeur: 72, hauteur: 72 } as const;

export interface Rect {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** L'épaisseur d'une route. */
const R = 26;

/** Un segment de route centré sur la ligne `x` (vertical, de `y1` à `y2`). */
const verticale = (x: number, y1: number, y2: number): Rect => ({ x: x - R / 2, y: Math.min(y1, y2), largeur: R, hauteur: Math.abs(y2 - y1) });
/** Un segment de route centré sur la ligne `y` (horizontal, de `x1` à `x2`). */
const horizontale = (y: number, x1: number, x2: number): Rect => ({ x: Math.min(x1, x2), y: y - R / 2, largeur: Math.abs(x2 - x1), hauteur: R });

/** Les routes grises : deux grands axes qui se croisent à l'enclos, et deux branches de chaque côté vers les lieux des angles. */
export const ROUTES_GRISES: readonly Rect[] = [
  verticale(CENTRE.x, CENTRE.y - 900, CENTRE.y + 900),
  horizontale(CENTRE.y, CENTRE.x - 560, CENTRE.x + 560),
  verticale(CENTRE.x + 260, CENTRE.y - 340, CENTRE.y + 340),
  horizontale(CENTRE.y - 340, CENTRE.x + 260, CENTRE.x + 520),
  horizontale(CENTRE.y + 340, CENTRE.x + 260, CENTRE.x + 520),
  verticale(CENTRE.x - 260, CENTRE.y - 340, CENTRE.y + 340),
  horizontale(CENTRE.y - 340, CENTRE.x - 520, CENTRE.x - 260),
  horizontale(CENTRE.y + 340, CENTRE.x - 520, CENTRE.x - 260),
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
export const rectDuLieu = (l: Pick<Lieu, 'x' | 'y'>): Rect => ({ x: l.x - LIEU.largeur / 2, y: l.y - LIEU.hauteur / 2, largeur: LIEU.largeur, hauteur: LIEU.hauteur });
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
 * Le décor de la pelouse : des arbres et des fleurs semés au hasard (toujours les mêmes, la graine est fixe), à l'écart des routes,
 * des lieux, de l'enclos et de la stèle, sous la chaîne de montagnes.
 */
export function decor(): ElementDeDecor[] {
  let graine = 20260;
  const alea = () => {
    graine = (graine * 1103515245 + 12345) % 2147483648;
    return graine / 2147483648;
  };
  const interdits = [...ROUTES_GRISES, ...LIEUX.map(rectDuLieu), rectDeLEnclos(), rectDeLaStele()];
  const emojis = ['🌳', '🌲', '🌳', '🌼', '🌻', '🌳'];
  const elements: ElementDeDecor[] = [];
  for (let i = 0; i < 320 && elements.length < 110; i++) {
    const taille = 28 + Math.round(alea() * 16);
    const x = 30 + alea() * (CARTE.largeur - 100);
    const y = 90 + alea() * (CARTE.hauteur - 160);
    const boite = { x, y, largeur: taille, hauteur: taille };
    if (interdits.some((r) => seDeborde(boite, r, 24))) continue;
    elements.push({ emoji: emojis[Math.floor(alea() * emojis.length)], x, y, taille });
  }
  return elements;
}
