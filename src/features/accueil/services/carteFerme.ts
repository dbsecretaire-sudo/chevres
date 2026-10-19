/**
 * La carte de la ferme : une grande pelouse que l'on fait glisser du doigt, avec des routes grises vers les lieux (aliments, laiterie,
 * fromagerie, boucherie, abattoir, vétérinaire, clients). Ici seulement la géométrie, sans rien d'affichage : les positions sont en points,
 * depuis le coin en haut à gauche de la carte.
 */

export const CARTE = { largeur: 1600, hauteur: 1600 } as const;

/** Le centre de la carte : l'enclos y est posé, d'où partent les routes. */
export const CENTRE = { x: 800, y: 800 } as const;

/** L'enclos du troupeau, au centre. */
export const ENCLOS = { largeur: 260, hauteur: 230 } as const;

/** La taille d'un lieu (sa carte cliquable). */
export const LIEU = { largeur: 140, hauteur: 116 } as const;

export type CleLieu = 'foin' | 'laiterie' | 'fromagerie' | 'charcuterie' | 'abattoir' | 'veterinaire' | 'contacts';

export interface Lieu {
  cle: CleLieu;
  /** Son dessin (un emoji, remplaçable par une illustration). */
  emoji: string;
  /** Le centre du lieu sur la carte. */
  x: number;
  y: number;
}

/** Les lieux de la carte : un par direction, chacun au bout d'une route. */
export const LIEUX: readonly Lieu[] = [
  { cle: 'foin', emoji: '🌾🌽', x: 800, y: 300 },
  { cle: 'laiterie', emoji: '🥛', x: 1320, y: 460 },
  { cle: 'fromagerie', emoji: '🧀', x: 1360, y: 800 },
  { cle: 'charcuterie', emoji: '🥩', x: 1320, y: 1140 },
  { cle: 'abattoir', emoji: '🏭', x: 800, y: 1300 },
  { cle: 'contacts', emoji: '🤝', x: 280, y: 1140 },
  { cle: 'veterinaire', emoji: '🩺', x: 240, y: 800 },
];

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

/** Les routes grises : deux grands axes qui se croisent à l'enclos, et trois branches (laiterie, boucherie, clients). */
export const ROUTES_GRISES: readonly Rect[] = [
  verticale(CENTRE.x, 300, 1300),
  horizontale(CENTRE.y, 240, 1360),
  verticale(1060, 460, 1140),
  horizontale(460, 1060, 1320),
  horizontale(1140, 1060, 1320),
  verticale(540, 800, 1140),
  horizontale(1140, 280, 540),
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

const seDeborde = (a: Rect, b: Rect, marge: number): boolean =>
  a.x < b.x + b.largeur + marge && a.x + a.largeur > b.x - marge && a.y < b.y + b.hauteur + marge && a.y + a.hauteur > b.y - marge;

export interface ElementDeDecor {
  emoji: string;
  x: number;
  y: number;
  taille: number;
}

/**
 * Le décor de la pelouse : des arbres et des fleurs semés au hasard (toujours les mêmes, la graine est fixe), à l'écart des routes,
 * des lieux et de l'enclos.
 */
export function decor(): ElementDeDecor[] {
  let graine = 20260;
  const alea = () => {
    graine = (graine * 1103515245 + 12345) % 2147483648;
    return graine / 2147483648;
  };
  const interdits = [...ROUTES_GRISES, ...LIEUX.map(rectDuLieu), rectDeLEnclos()];
  const emojis = ['🌳', '🌲', '🌳', '🌼', '🌻', '🌳'];
  const elements: ElementDeDecor[] = [];
  for (let i = 0; i < 160 && elements.length < 70; i++) {
    const taille = 28 + Math.round(alea() * 16);
    const x = 30 + alea() * (CARTE.largeur - 100);
    const y = 30 + alea() * (CARTE.hauteur - 100);
    const boite = { x, y, largeur: taille, hauteur: taille };
    if (interdits.some((r) => seDeborde(boite, r, 24))) continue;
    elements.push({ emoji: emojis[Math.floor(alea() * emojis.length)], x, y, taille });
  }
  return elements;
}
